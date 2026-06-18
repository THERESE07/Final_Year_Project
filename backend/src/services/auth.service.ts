import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';
import sequelize from '../config/database';
import { User, Farmer, Cooperative, Notification, UserDocument } from '../models/associations';
import {
  generateAccessToken, generateRefreshToken,
  saveRefreshToken, validateRefreshToken, revokeRefreshToken
} from '../utils/jwt';
import { notifyCoopLeader, notifyAdmins } from '../utils/notify';
import logger from '../utils/logger';

export class AuthService {
  /** Public list for registration dropdown (cooperative leaders) */
  static async getRegistrationCooperatives() {
    const coops = await Cooperative.findAll({
      where: { status: 'active' },
      attributes: ['id', 'name', 'province', 'district', 'sector', 'manager_id'],
      order: [['name', 'ASC']],
    });
    return coops.map((c) => ({
      id: c.id,
      name: c.name,
      province: c.province,
      district: c.district,
      sector: c.sector,
      has_manager: !!c.manager_id,
    }));
  }

  static async register(data: any, files?: { national_id_doc?: Express.Multer.File; authorization_letter?: Express.Multer.File }) {
    const existing = await User.findOne({
      where: {
        [Op.or]: [
          { email: data.email },
          { national_id: data.national_id },
          { phone: data.phone },
        ],
      },
    });
    if (existing) {
      if (existing.email === data.email) throw new Error('Email already registered');
      if (existing.national_id === data.national_id) throw new Error('National ID already registered');
      if (existing.phone === data.phone) throw new Error('Phone number already registered');
    }

    if (data.role === 'cooperative') {
      if (!data.cooperative_id) throw new Error('Please select a cooperative');
      const coop = await Cooperative.findByPk(data.cooperative_id);
      if (!coop) throw new Error('Selected cooperative not found');
      if (coop.status !== 'active') throw new Error('Selected cooperative is not active');
      if (coop.manager_id) throw new Error('This cooperative already has a manager assigned');
      if (!files?.national_id_doc || !files?.authorization_letter) {
        throw new Error('National ID document and authorization letter are required for cooperative leaders');
      }
    }

    if (data.role === 'farmer' && !data.cooperative_id && !data.cooperative_name) {
      throw new Error('Please select or enter your cooperative');
    }

    const initialStatus = data.role === 'farmer'
      ? 'pending_coop_approval'
      : data.role === 'cooperative'
        ? 'pending_admin_approval'
        : 'pending';

    const user = await sequelize.transaction(async (t) => {
      const created = await User.create({
        full_name: data.full_name,
        national_id: data.national_id,
        email: data.email,
        phone: data.phone,
        password_hash: data.password,
        gender: data.gender,
        role: data.role || 'farmer',
        status: initialStatus,
        registration_cooperative_id: data.role === 'cooperative' ? data.cooperative_id : undefined,
      }, { transaction: t });

      if (created.role === 'farmer') {
        let cooperativeId: string | null = null;
        if (data.cooperative_id) {
          const coop = await Cooperative.findByPk(data.cooperative_id, { transaction: t });
          if (!coop) throw new Error('Selected cooperative not found');
          cooperativeId = coop.id;
        } else if (data.cooperative_name) {
          let coop = await Cooperative.findOne({
            where: { name: { [Op.iLike]: `%${data.cooperative_name}%` } },
            transaction: t,
          });
          if (!coop && data.province) {
            coop = await Cooperative.create({
              name: data.cooperative_name,
              province: data.province || '',
              district: data.district || '',
              sector: data.sector || '',
            }, { transaction: t });
          }
          cooperativeId = coop?.id ?? null;
        }

        if (!cooperativeId) throw new Error('Cooperative is required for farmer registration');

        const farmerCode = `FRM${Date.now().toString().slice(-6)}`;
        await Farmer.create({
          user_id: created.id,
          cooperative_id: cooperativeId,
          farmer_code: farmerCode,
          farm_size_hectares: data.farm_size_hectares,
          land_ownership: data.land_ownership,
          years_of_experience: data.years_of_experience,
          crop_types: data.crop_types,
          province: data.province,
          district: data.district,
          sector: data.sector,
        }, { transaction: t });
      }

      if (created.role === 'cooperative' && files) {
        const docs: Array<{ type: string; file: Express.Multer.File }> = [
          { type: 'national_id', file: files.national_id_doc! },
          { type: 'authorization_letter', file: files.authorization_letter! },
        ];
        for (const doc of docs) {
          await UserDocument.create({
            user_id: created.id,
            document_type: doc.type,
            file_name: doc.file.originalname,
            file_path: `/uploads/documents/${doc.file.filename}`,
            mime_type: doc.file.mimetype,
            file_size: doc.file.size,
          }, { transaction: t });
        }
      }

      return created;
    });

    if (user.role === 'farmer') {
      const farmer = await Farmer.findOne({ where: { user_id: user.id } });
      if (farmer?.cooperative_id) {
        await notifyCoopLeader(
          farmer.cooperative_id,
          'New Farmer Registration',
          `${user.full_name} has registered and is awaiting your approval.`,
          'registration',
          user.id,
          'user',
        );
      }
    }

    if (user.role === 'cooperative') {
      await notifyAdmins(
        'New Cooperative Leader Application',
        `${user.full_name} has applied to lead a cooperative and requires admin review.`,
        'registration',
        user.id,
        'user',
      );
    }

    logger.info(`New user registered: ${user.email} (${user.role}, status=${user.status})`);
    return user.toSafeObject();
  }

  static async login(credentials: any) {
    const { email, password, phone, pin, login_method = 'email' } = credentials;

    let user: User | null;
    if (login_method === 'mobile') {
      user = await User.findOne({ where: { phone } });
    } else {
      user = await User.findOne({ where: { email } });
    }

    if (!user) throw new Error('Invalid credentials');
    if (user.status === 'pending_coop_approval') {
      throw new Error('Your registration is awaiting approval from your cooperative leader.');
    }
    if (user.status === 'pending_admin_approval' || user.status === 'pending') {
      throw new Error('Your registration is awaiting administrator approval.');
    }
    if (user.status === 'suspended') throw new Error('Account suspended. Contact administrator.');
    if (user.status === 'rejected') {
      const msg = user.approval_feedback
        ? `Account application was rejected: ${user.approval_feedback}`
        : 'Account application was rejected. Contact administrator.';
      throw new Error(msg);
    }

    let isValid = false;
    if (login_method === 'mobile' && pin) {
      isValid = await user.comparePin(pin);
    } else {
      isValid = await user.comparePassword(password);
    }
    if (!isValid) throw new Error('Invalid credentials');

    await user.update({ last_login: new Date() });

    const payload = { userId: user.id, role: user.role, email: user.email };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken();
    await saveRefreshToken(user.id, refreshToken);

    logger.info(`User logged in: ${user.email}`);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: 900,
      user: user.toSafeObject(),
    };
  }

  static async refreshTokens(token: string) {
    const rt = await validateRefreshToken(token);
    if (!rt) throw new Error('Invalid or expired refresh token');

    const user = await User.findByPk(rt.user_id);
    if (!user || user.status !== 'active') throw new Error('User not found or inactive');

    await revokeRefreshToken(token);
    const payload = { userId: user.id, role: user.role, email: user.email };
    const newAccessToken = generateAccessToken(payload);
    const newRefreshToken = generateRefreshToken();
    await saveRefreshToken(user.id, newRefreshToken);

    return { access_token: newAccessToken, refresh_token: newRefreshToken, expires_in: 900 };
  }

  static async logout(refreshToken: string) {
    if (refreshToken) await revokeRefreshToken(refreshToken);
  }

  static async getProfile(userId: string) {
    const user = await User.findByPk(userId, {
      include: [
        {
          model: Farmer,
          as: 'farmer_profile',
          include: [{ model: Cooperative, as: 'cooperative' }],
        },
      ],
    });
    if (!user) throw new Error('User not found');
    return user.toSafeObject();
  }

  static async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await User.findByPk(userId);
    if (!user) throw new Error('User not found');
    const isValid = await user.comparePassword(currentPassword);
    if (!isValid) throw new Error('Current password is incorrect');
    const newHash = await bcrypt.hash(newPassword, 12);
    await user.update({ password_hash: newHash });

    await Notification.create({
      user_id: userId,
      title: 'Password Changed',
      message: 'Your password has been changed successfully.',
      type: 'security',
    } as any);
  }
}