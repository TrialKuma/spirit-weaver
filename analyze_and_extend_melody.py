"""
旋律分析与续写工具
用途: 从 MP3 提取主旋律 → Markov链续写 → 输出双轨 MIDI
"""
import warnings
warnings.filterwarnings('ignore')

import librosa
import numpy as np
from midiutil import MIDIFile
from collections import defaultdict


# ──────────────────────────────────────────────
# 工具函数
# ──────────────────────────────────────────────

def hz_to_midi(freq):
    if freq is None or freq <= 0 or np.isnan(freq):
        return None
    midi = 69 + 12 * np.log2(freq / 440.0)
    return int(round(midi))


def quantize_to_beat(sec, beat_sec, subdivisions=4):
    """把秒数时值量化到最近的节拍细分"""
    unit = beat_sec / subdivisions
    return max(unit, round(sec / unit) * unit)


# ──────────────────────────────────────────────
# 第一步：音频分析
# ──────────────────────────────────────────────

def analyze_audio(mp3_path):
    print("═" * 50)
    print("【第一步】加载并分析音频")
    y, sr = librosa.load(mp3_path, sr=None, mono=True)
    duration = librosa.get_duration(y=y, sr=sr)
    print(f"  时长: {duration:.2f}秒   采样率: {sr}Hz")

    # BPM
    tempo_arr, beats = librosa.beat.beat_track(y=y, sr=sr)
    tempo = float(np.atleast_1d(tempo_arr)[0])
    beat_sec = 60.0 / tempo
    print(f"  BPM: {tempo:.1f}  (每拍 {beat_sec:.3f}秒)")

    # 调性 / 主音
    chroma = librosa.feature.chroma_cqt(y=y, sr=sr)
    chroma_mean = chroma.mean(axis=1)
    key_names = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']
    root_idx = int(np.argmax(chroma_mean))
    detected_key = key_names[root_idx]
    print(f"  检测到调性根音: {detected_key}")

    return y, sr, tempo, beat_sec, detected_key, duration


# ──────────────────────────────────────────────
# 第二步：PYIN 音高提取 → 音符序列
# ──────────────────────────────────────────────

def extract_notes(y, sr, beat_sec):
    print("\n【第二步】PYIN 音高追踪")
    f0, voiced_flag, _ = librosa.pyin(
        y,
        fmin=librosa.note_to_hz('C2'),
        fmax=librosa.note_to_hz('C7'),
        sr=sr,
        frame_length=2048,
    )
    times = librosa.times_like(f0, sr=sr)
    hop = float(times[1] - times[0]) if len(times) > 1 else 0.01

    # 原始音高点（只保留有声部分）
    raw = [(t, hz_to_midi(f)) for t, f, v in zip(times, f0, voiced_flag)
           if v and f and not np.isnan(f)]
    raw = [(t, n) for t, n in raw if n is not None and 36 <= n <= 96]
    print(f"  有效音高帧: {len(raw)}")

    # 合并相邻相同音符
    note_seq = []   # (start_sec, midi_note, duration_sec)
    if not raw:
        print("  警告: 未检测到有效音高，请检查音频内容")
        return note_seq

    seg_t, seg_n = raw[0]
    prev_t = seg_t

    for i in range(1, len(raw)):
        t, n = raw[i]
        gap = t - prev_t
        changed = abs(n - seg_n) > 1   # 半音以上才算换音
        if changed or gap > hop * 4:
            dur = prev_t - seg_t + hop
            note_seq.append((seg_t, int(round(seg_n)), dur))
            seg_t, seg_n = t, n
        prev_t = t

    note_seq.append((seg_t, int(round(seg_n)), prev_t - seg_t + hop))

    # 量化时值
    note_seq = [(s, n, quantize_to_beat(d, beat_sec)) for s, n, d in note_seq]

    notes_only = [n for _, n, _ in note_seq]
    print(f"  合并后音符数: {len(note_seq)}")
    print(f"  音域: MIDI {min(notes_only)} ~ {max(notes_only)}"
          f"  ({librosa.midi_to_note(min(notes_only))} ~ {librosa.midi_to_note(max(notes_only))})")
    return note_seq


# ──────────────────────────────────────────────
# 第三步：Markov 链统计 + 续写
# ──────────────────────────────────────────────

def build_markov(note_seq, order=2):
    """构建 order 阶 Markov 链（基于音程序列）"""
    notes = [n for _, n, _ in note_seq]
    durs  = [d for _, _, d in note_seq]
    intervals = [notes[i+1] - notes[i] for i in range(len(notes)-1)]

    chain = defaultdict(list)
    for i in range(len(intervals) - order):
        key = tuple(intervals[i:i+order])
        chain[key].append(intervals[i+order])

    return chain, notes, durs, intervals


def generate_extension(note_seq, beat_sec, bars=16, seed=None):
    """用 Markov 链生成续写片段"""
    print(f"\n【第三步】Markov 链续写 ({bars} 小节)")
    rng = np.random.default_rng(seed)

    order = 2
    chain, notes, durs, intervals = build_markov(note_seq, order)

    if not chain:
        order = 1
        chain, notes, durs, intervals = build_markov(note_seq, order)

    target_sec = bars * 4 * beat_sec
    note_range = (min(notes), max(notes))

    generated = []          # (start_sec, midi_note, duration_sec)
    current_time = 0.0
    current_note = notes[-1]
    ctx = tuple(intervals[-order:])

    while current_time < target_sec:
        # 选下一个音程
        if ctx in chain:
            choices = chain[ctx]
            step = int(rng.choice(choices))
        else:
            step = int(rng.choice(intervals))

        next_note = current_note + step

        # 音域限制：超出则镜像翻转
        if next_note > note_range[1] + 2:
            next_note = current_note - abs(step)
        if next_note < note_range[0] - 2:
            next_note = current_note + abs(step)
        next_note = int(np.clip(next_note, 36, 96))

        # 随机选一个原曲时值
        dur = float(rng.choice(durs))
        dur = quantize_to_beat(dur, beat_sec)

        generated.append((current_time, next_note, dur))
        current_time += dur
        current_note = next_note
        ctx = (*ctx[1:], step) if order > 1 else (step,)

    print(f"  生成音符数: {len(generated)}  "
          f"总时长: {current_time:.2f}秒")
    return generated


# ──────────────────────────────────────────────
# 第四步：写 MIDI
# ──────────────────────────────────────────────

def write_midi(note_seq, generated, tempo, original_duration_sec, output_path):
    print(f"\n【第四步】写入 MIDI")
    beat_sec = 60.0 / tempo

    midi = MIDIFile(2)

    # ── 轨道 0：原曲提取旋律
    midi.addTrackName(0, 0, "Original Melody (extracted)")
    midi.addTempo(0, 0, tempo)
    midi.addProgramChange(0, 0, 0, 0)   # 0 = Acoustic Grand Piano

    for start_sec, note, dur_sec in note_seq:
        beat_start = start_sec / beat_sec
        beat_dur   = max(0.1, dur_sec / beat_sec)
        midi.addNote(0, 0, note, beat_start, beat_dur, 80)

    # ── 轨道 1：续写旋律（接在原曲后面）
    midi.addTrackName(1, 0, "Extension (generated)")
    midi.addTempo(1, 0, tempo)
    midi.addProgramChange(1, 1, 0, 0)

    offset_beats = original_duration_sec / beat_sec
    for start_sec, note, dur_sec in generated:
        beat_start = offset_beats + start_sec / beat_sec
        beat_dur   = max(0.1, dur_sec / beat_sec)
        midi.addNote(1, 1, note, beat_start, beat_dur, 72)

    with open(output_path, 'wb') as f:
        midi.writeFile(f)

    print(f"  已保存: {output_path}")
    print(f"  轨道1 (原曲旋律): {len(note_seq)} 个音符")
    print(f"  轨道2 (续写片段): {len(generated)} 个音符")


# ──────────────────────────────────────────────
# 合成器推荐说明
# ──────────────────────────────────────────────

SYNTH_GUIDE = """
══════════════════════════════════════════════
合成器推荐（根据曲风选择）
══════════════════════════════════════════════

✦ 如果原曲是「清脆/钢琴/弦乐」风格
  → MuseScore 4 (免费) + FluidSynth + MuseScore_General.sf3
  → 直接导入 MIDI，选管弦乐器即可

✦ 如果原曲是「电子/合成器/游戏 8-bit」风格
  → LMMS (免费) 内置 ZynAddSubFX
  → Surge XT (免费) —— 大量电子音色预设

✦ 如果想复现「AI生成歌曲」质感（有人声/混音感）
  → FL Studio Demo (免费) + Vital 合成器 (免费)
  → 在 Vital 里选 Pad / Lead 类音色

✦ 游戏内直接播放 MIDI (Web端)
  → Tone.js + @tonejs/midi  (JavaScript)
  → 代码示例见 https://tonejs.github.io/

✦ 在线预览/调整
  → https://midiano.com  (可视化键盘)
  → https://signal.vercel.app  (完整MIDI编辑器，免费)
══════════════════════════════════════════════
"""


# ──────────────────────────────────────────────
# 主入口
# ──────────────────────────────────────────────

if __name__ == '__main__':
    MP3_PATH    = r"h:\代码项目\spirit-weaver\game-v2\assets\audio\qi_surge_the_emerald_comet.mp3"
    OUTPUT_MIDI = r"h:\代码项目\spirit-weaver\game-v2\assets\audio\melody_extended.mid"
    EXTEND_BARS = 16          # 续写小节数，可以调整

    np.random.seed(42)

    y, sr, tempo, beat_sec, key, duration = analyze_audio(MP3_PATH)
    note_seq   = extract_notes(y, sr, beat_sec)

    if len(note_seq) < 4:
        print("\n⚠ 提取音符过少（可能是复音/打击乐为主的曲子），难以续写。")
        print("   建议：手动提供一段主旋律的单独 MIDI 轨道再运行本脚本。")
    else:
        generated  = generate_extension(note_seq, beat_sec, bars=EXTEND_BARS, seed=42)
        write_midi(note_seq, generated, tempo, duration, OUTPUT_MIDI)

    print(SYNTH_GUIDE)
