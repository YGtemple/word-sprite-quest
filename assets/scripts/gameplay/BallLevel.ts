/**
 * CONTRACT v1.3 注册表兼容层。
 *
 * LevelManager 的 registry 用 `Ball: SpriteBallLevel` 映射（CONTRACT §7），
 * 而早期派发单里用的是 `BallLevel` 这个名字。这个文件只做转发别名，
 * 保证两种 import 都能工作，不必改动注册表。
 */
export { SpriteBallLevel as BallLevel } from './SpriteBallLevel';
