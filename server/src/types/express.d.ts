import { IUser } from '../models/User.js';
import { IDevice } from '../models/Device.js';

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      device?: IDevice;
    }
  }
}
