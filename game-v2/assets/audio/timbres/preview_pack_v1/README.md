# 开源音色试听包 V1

这是一组先用于试听和筛选方向的开源音色资源，暂时还没有接入 `tools/generate_bgm_wav.py`。

## 来源与许可证

- `vcsl/*`
  - 来源：VCSL（Versilian Community Sample Library）
  - 仓库：`https://github.com/sgossner/VCSL`
  - 许可证：`CC0-1.0`
  - 本地许可证文件：`licenses/VCSL_LICENSE.txt`
- `soundfonts/FluidR3_GS.sf2`
  - 来源：Fluid (R3) SoundFont 发布页
  - 仓库：`https://github.com/pianobooster/fluid-soundfont`
  - 许可证：`MIT`
  - 本地许可证文件：`licenses/FluidR3_COPYING.txt`

## 当前试听包内容

- `vcsl/ocarina/`
  - 偏气口、偏东方感，适合拿来试 `气宗` 主旋律长音
- `vcsl/frame-drum/`
  - 中低频鼓击和闷击，适合 `气宗` / `剑圣` 的战斗骨架
- `vcsl/strumstick/`
  - 拨弦瞬态更明显，适合试 `剑圣` 的高速推进型短句
- `vcsl/folk-harp/`
  - 比较柔和的拨弦底色，适合 `判官` 的支撑层或过门
- `vcsl/clavisynth/`
  - 偏 FM/数字感，适合 `魔导` 的法阵、晶体、能量类层次
- `vcsl/hand-chimes/`
  - 清亮悬浮，适合 `魔导` / `判官` 的高频点缀与和声托底
- `vcsl/gong/`
  - 长尾金属共振，适合 `气宗` / `判官` 的转段、落点、开场提示
- `soundfonts/FluidR3_GS.sf2`
  - 体积较小的通用 SoundFont，先作为后续接入采样渲染链路的轻量备选

## 建议试听顺序

- `气宗`
  - 先听 `vcsl/ocarina/`
  - 再听 `vcsl/frame-drum/` 和 `vcsl/gong/`
- `剑圣`
  - 先听 `vcsl/strumstick/`
  - 再听 `vcsl/frame-drum/`
- `魔导`
  - 先听 `vcsl/clavisynth/`
  - 再听 `vcsl/hand-chimes/`
- `判官`
  - 先听 `vcsl/folk-harp/`
  - 再听 `vcsl/hand-chimes/` 和 `vcsl/gong/`

## 这包资源的定位

- 目标不是一次性定最终方案，而是先缩小“乐器质感”的选择范围
- 这一包优先覆盖你当前四首战斗 BGM 最可能用到的音色方向
- 如果你试听后觉得某个方向对了，下一步我可以只围绕那一类继续扩一版 `preview_pack_v2`
- 如果你确认某几类可以用，再把它们接进当前 `Python -> WAV` 生成流程

## 备注

- 当前只下载了一个轻量的 `FluidR3_GS.sf2`
- 如果后面决定真的走 SoundFont 渲染链路，可以再补更完整但更大的 `FluidR3_GM.sf2`
