import Container, { Service } from 'typedi';
import { User } from '@interfaces/users.interface';
import { UserModel } from '@/models/user.model';
import { AuthService } from './auth.service';
import { randomUUID } from 'crypto';
import { Auth } from 'googleapis';

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
}
