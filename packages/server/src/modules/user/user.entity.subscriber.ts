import { DataSource, EntitySubscriberInterface, EventSubscriber, InsertEvent } from 'typeorm';
import { User } from './user.entity';
import { FileService } from '../file/file.service';
import { createIdenticon } from '../../utils/create-identicon.util';
import { generateMD5 } from '../../utils/generate-md5.util';
import { USER_UPLOAD_IMAGE_DIR } from '../../constants';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { ApplicationLogger } from '../../common/application.logger.service';
import { FileSourceEnum } from '../../enums/file-source.enum';

@EventSubscriber()
export class UserEntitySubscriber implements EntitySubscriberInterface<User> {
  private logger = new ApplicationLogger(UserEntitySubscriber.name);

  constructor(dataSource: DataSource, private fileService: FileService) {
    dataSource.subscribers.push(this);
  }

  listenTo() {
    return User;
  }

  async beforeInsert(event: InsertEvent<User>) {
    if (!event.entity.avatar) {
      try {
        const filename = randomUUID().replace(/-/g, '') + '.png';
        const filepath = path.join(USER_UPLOAD_IMAGE_DIR, filename);
        const { file: identicon, md5 } = await createIdenticon(await generateMD5(event.entity.username), filepath);
        event.entity.avatar = await this.fileService.save({
          filename,
          name: filename,
          size: identicon.size,
          md5,
          source: FileSourceEnum.AUTO_GENERATED,
          path: filepath,
        });
      } catch (error) {
        this.logger.error(
          `Create identicon for user '${event.entity.username}' failed`,
          error.stack,
          UserEntitySubscriber.name,
        );
      }
    }
  }
}
