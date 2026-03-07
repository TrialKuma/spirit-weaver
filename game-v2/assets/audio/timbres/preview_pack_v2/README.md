# preview_pack_v2

这一包不再是零散单乐器 `wav` 试听，而是给离线 BGM 渲染使用的标准 GM SoundFont。

## 内容

- `soundfonts/GeneralUser-GS.sf2`
  - 来源：`https://github.com/mrbumpy409/GeneralUser-GS`
  - 用途：作为 `V10` 及后续“正常 GM 音色版”BGM 的主音色库
- `licenses/GeneralUser-GS-LICENSE.txt`
  - 保存随仓库同步下来的许可证文本
- `README_SOURCE.md`
  - 保存上游仓库首页说明，便于后续追溯版本来源

## 当前接入方式

- 渲染脚本：`tools/generate_bgm_wav.py`
- 渲染后端：`tools/vendor/py_meltysynth/meltysynth.py`
- 当前配置档：`--profile gm_v1`

## 备注

- 这轮主要目标是先把战斗 BGM 的主旋律、支持层、法阵/分解层切回更正常的 GM 乐器听感
- `preview_pack_v1` 保留，继续作为上一轮怪采样实验的对照
