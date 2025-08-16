import Container, { Service } from 'typedi';
import { User, UserProfile } from '@interfaces/users.interface';
import { UserModel } from '@/models/user.model';
import { UserProfileModel } from '@/models/user_profile.model';
import { AuthService } from './auth.service';
import { randomUUID } from 'crypto';
import { Auth } from 'googleapis';
import axios from 'axios';

@Service()
export class UserService {
  private authService = Container.get(AuthService);
  public async findUserByEmail(email: string) {
    const findUser: User = await UserModel.findOne({ email: email });
    return findUser;
  }

  public async createUserFromGoogle(googleUser: Auth.TokenPayload): Promise<User> {
    const { email } = googleUser;
    const user = await this.authService.signup({ email, password: randomUUID() });
    return user;
  }

  public async fetchAvatarFromURL(url: string): Promise<Buffer> {
    if (!url) {
      return null;
    }
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    return Buffer.from(response.data);
  }
}
