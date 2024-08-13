import { HTTP } from "koishi";
import { Config } from '.';

class OsuApi {
  constructor(
    private readonly http: HTTP,
    private readonly config: Config,
  ) {}
}
