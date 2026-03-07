import argparse
import math
import os
import random
import struct
import sys
import wave
from array import array

SAMPLE_RATE = 44100
MASTER_GAIN = 0.72
TOTAL_BARS = 16

SEMITONES = {
    "C": -9, "C#": -8, "Db": -8, "D": -7, "D#": -6, "Eb": -6, "E": -5,
    "F": -4, "F#": -3, "Gb": -3, "G": -2, "G#": -1, "Ab": -1,
    "A": 0, "A#": 1, "Bb": 1, "B": 2,
}

THEMES = {
    # 气宗：蓄势爆发，重拍明显，五声动机，局部三连
    "qi": {
        "tempo": 128,
        "chords": [
            ["A2", "E3", "A3", "C#4"], ["A2", "E3", "B3", "C#4"], ["D2", "A2", "D3", "F#3"], ["D2", "A2", "E3", "F#3"],
            ["F#2", "C#3", "F#3", "A3"], ["D2", "A2", "D3", "F#3"], ["E2", "B2", "E3", "G#3"], ["E2", "B2", "C#3", "G#3"],
            ["A2", "E3", "A3", "C#4"], ["A2", "E3", "B3", "E4"], ["D2", "A2", "D3", "F#3"], ["D2", "A2", "C#3", "F#3"],
            ["F#2", "C#3", "F#3", "A3"], ["E2", "B2", "E3", "G#3"], ["D2", "A2", "D3", "F#3"], ["E2", "B2", "E3", "A3"],
        ],
        "motif": ["A4", "B4", "C#5", "E5", "F#5", "E5", "C#5", "B4"],
        "counter": ["E4", "F#4", "A4", "C#5", "B4", "A4"],
        "pad_tone": 0.55,
        "lead_tone": 1.15,
        "stereo": 0.10,
        "drum_mode": "taiko",
    },
    # 剑圣：高速连击，16分推进，重复音与上冲短句
    "combo": {
        "tempo": 158,
        "chords": [
            ["E2", "B2", "E3", "G3"], ["E2", "B2", "D3", "G3"], ["C2", "G2", "C3", "E3"], ["D2", "A2", "D3", "F#3"],
            ["E2", "B2", "E3", "G3"], ["E2", "B2", "F#3", "A3"], ["C2", "G2", "C3", "E3"], ["B1", "F#2", "B2", "D#3"],
            ["E2", "B2", "E3", "G3"], ["E2", "B2", "D3", "G3"], ["C2", "G2", "C3", "E3"], ["D2", "A2", "D3", "F#3"],
            ["B1", "F#2", "B2", "D#3"], ["B1", "F#2", "A2", "D#3"], ["C2", "G2", "C3", "E3"], ["D2", "A2", "E3", "F#3"],
        ],
        "motif": ["B4", "B4", "D5", "E5", "G5", "F#5", "E5", "D5"],
        "counter": ["G4", "F#4", "E4", "D4", "B3", "D4"],
        "pad_tone": 0.8,
        "lead_tone": 2.2,
        "stereo": 0.15,
        "drum_mode": "rush",
    },
    # 魔导：脉冲法阵，分解和弦，晶体高频点缀
    "mana": {
        "tempo": 140,
        "chords": [
            ["D3", "A3", "C4", "F4"], ["D3", "A3", "C4", "E4"], ["Bb2", "F3", "A3", "D4"], ["Bb2", "F3", "A3", "C4"],
            ["G2", "D3", "F3", "Bb3"], ["G2", "D3", "F3", "A3"], ["A2", "E3", "G3", "C#4"], ["A2", "E3", "G3", "B3"],
            ["D3", "A3", "C4", "F4"], ["D3", "A3", "C4", "E4"], ["Bb2", "F3", "A3", "D4"], ["G2", "D3", "F3", "Bb3"],
            ["A2", "E3", "G3", "C#4"], ["A2", "E3", "G3", "B3"], ["D3", "A3", "C4", "F4"], ["A2", "E3", "A3", "C#4"],
        ],
        "motif": ["D5", "A5", "F5", "C5", "C#5", "E5", "G5", "C6"],
        "counter": ["A4", "G#4", "F4", "E4", "D4", "C#4"],
        "pad_tone": 1.25,
        "lead_tone": 2.8,
        "stereo": 0.20,
        "drum_mode": "pulse",
    },
    # 判官：明暗对照，3+3+2重心，镜像动机
    "balance": {
        "tempo": 124,
        "chords": [
            ["D3", "A3", "D4", "F#4"], ["G3", "D4", "G4", "B4"], ["A3", "E4", "A4", "C#5"], ["D3", "A3", "E4", "B4"],
            ["D3", "A3", "D4", "F#4"], ["G3", "D4", "G4", "B4"], ["A3", "E4", "A4", "C#5"], ["G3", "D4", "A4", "B4"],
            ["D3", "A3", "D4", "F#4"], ["G3", "D4", "G4", "B4"], ["A3", "E4", "A4", "C#5"], ["D3", "A3", "E4", "B4"],
            ["D3", "A3", "D4", "F#4"], ["G3", "D4", "G4", "B4"], ["A3", "E4", "A4", "C#5"], ["G3", "D4", "A4", "B4"],
        ],
        "motif_bright": ["A4", "B4", "D5", "E5", "F#5", "E5", "D5"],
        "motif_dark": ["A5", "F#5", "E5", "D5", "E5", "A5", "B5"],
        "counter_bright": ["D4", "E4", "F#4", "A4", "B4"],
        "counter_dark": ["B4", "A4", "F#4", "E4", "D4"],
        "pad_tone": 0.45,
        "lead_tone": 1.05,
        "stereo": 0.13,
        "drum_mode": "judgment",
    },
}

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TIMBRE_ROOT = os.path.join(PROJECT_ROOT, "assets", "audio", "timbres", "preview_pack_v1")
TIMBRE_ROOT_V2 = os.path.join(PROJECT_ROOT, "assets", "audio", "timbres", "preview_pack_v2")
CURRENT_PROFILE = "synth"
SAMPLE_CACHE = {}
GM_RENDER_CACHE = {}
GM_SOUND_FONT = None
SAMPLE_BANKS = {
    "ocarina": [
        {"note": "A3", "path": os.path.join(TIMBRE_ROOT, "vcsl", "ocarina", "StdOcarina_Sus_A3.wav")},
        {"note": "D4", "path": os.path.join(TIMBRE_ROOT, "vcsl", "ocarina", "StdOcarina_Sus_D4.wav")},
        {"note": "A4", "path": os.path.join(TIMBRE_ROOT, "vcsl", "ocarina", "StdOcarina_Sus_A4.wav")},
    ],
    "frame_drum_low": [
        {"path": os.path.join(TIMBRE_ROOT, "vcsl", "frame-drum", "HDrumL_Hit_v3_rr1_Sum.wav")},
        {"path": os.path.join(TIMBRE_ROOT, "vcsl", "frame-drum", "HDrumL_HitMuted_v3_rr1_Sum.wav")},
    ],
    "frame_drum_small": [
        {"path": os.path.join(TIMBRE_ROOT, "vcsl", "frame-drum", "HDrumS_Hit_v3_rr1_Sum.wav")},
    ],
    "strumstick": [
        {"note": "A2", "path": os.path.join(TIMBRE_ROOT, "vcsl", "strumstick", "Strumstick_Finger_Str2_Main_A2_vl3_rr1.wav")},
        {"note": "D3", "path": os.path.join(TIMBRE_ROOT, "vcsl", "strumstick", "Strumstick_Finger_Str2_Main_D3_vl2_rr1.wav")},
        {"note": "G2", "path": os.path.join(TIMBRE_ROOT, "vcsl", "strumstick", "Strumstick_Finger_Str1_Main_G2_vl3_rr1.wav")},
    ],
    "folk_harp": [
        {"note": "C3", "path": os.path.join(TIMBRE_ROOT, "vcsl", "folk-harp", "EWHarp_Normal_C3_v3_RR1.wav")},
        {"note": "C4", "path": os.path.join(TIMBRE_ROOT, "vcsl", "folk-harp", "EWHarp_Normal_C4_v3_RR1.wav")},
        {"note": "C5", "path": os.path.join(TIMBRE_ROOT, "vcsl", "folk-harp", "EWHarp_Normal_C5_v3_RR1.wav")},
    ],
    "clavisynth": [
        {"note": "C2", "path": os.path.join(TIMBRE_ROOT, "vcsl", "clavisynth", "Clavisynth_C2_vl2.wav")},
        {"note": "C4", "path": os.path.join(TIMBRE_ROOT, "vcsl", "clavisynth", "Clavisynth_C4_vl2.wav")},
        {"note": "C5", "path": os.path.join(TIMBRE_ROOT, "vcsl", "clavisynth", "Clavisynth_C5_vl3.wav")},
    ],
    "hand_chimes": [
        {"note": "C4", "path": os.path.join(TIMBRE_ROOT, "vcsl", "hand-chimes", "sus_C4_r01_main.wav")},
        {"note": "E4", "path": os.path.join(TIMBRE_ROOT, "vcsl", "hand-chimes", "sus_E4_r01_main.wav")},
        {"note": "G#4", "path": os.path.join(TIMBRE_ROOT, "vcsl", "hand-chimes", "sus_Gs4_r01_main.wav")},
    ],
    "gong": [
        {"path": os.path.join(TIMBRE_ROOT, "vcsl", "gong", "gong_mf.wav")},
    ],
}

MELTYSYNTH_ROOT = os.path.join(PROJECT_ROOT, "tools", "vendor", "py_meltysynth")
if MELTYSYNTH_ROOT not in sys.path:
    sys.path.insert(0, MELTYSYNTH_ROOT)

try:
    import meltysynth as ms
except Exception:
    ms = None

GM_SOUND_FONT_PATH = os.path.join(TIMBRE_ROOT_V2, "soundfonts", "GeneralUser-GS.sf2")
GM_PROGRAMS = {
    "qi_pad": 48,
    "qi_bass": 32,
    "qi_lead": 73,
    "qi_support": 49,
    "combo_pad": 49,
    "combo_lead": 29,
    "combo_support": 48,
    "mana_pad": 89,
    "mana_bass": 33,
    "mana_lead": 81,
    "mana_arp": 98,
    "mana_support": 89,
    "balance_pad": 49,
    "balance_bass": 32,
    "balance_lead": 69,
    "balance_support": 48,
}


def note_to_freq(note: str) -> float:
    name = note[:-1]
    octave = int(note[-1])
    semitone = SEMITONES[name] + (octave - 4) * 12
    return 440.0 * (2.0 ** (semitone / 12.0))


def note_to_midi(note: str) -> int:
    name = note[:-1]
    octave = int(note[-1])
    semitone = SEMITONES[name] + (octave - 4) * 12
    return 69 + semitone


def is_gm_profile():
    return CURRENT_PROFILE == "gm_v1"


def is_sample_profile():
    return CURRENT_PROFILE == "sampled_v1"


def note_distance(freq_a, freq_b):
    return abs(math.log(max(freq_a, 1e-6) / max(freq_b, 1e-6), 2.0))


def decode_pcm_sample(raw, offset, sampwidth):
    if sampwidth == 1:
        return (raw[offset] - 128) / 128.0
    if sampwidth == 2:
        return struct.unpack_from("<h", raw, offset)[0] / 32768.0
    if sampwidth == 3:
        chunk = raw[offset:offset + 3]
        pad = b"\xff" if chunk[2] & 0x80 else b"\x00"
        return int.from_bytes(chunk + pad, "little", signed=True) / 8388608.0
    if sampwidth == 4:
        return struct.unpack_from("<i", raw, offset)[0] / 2147483648.0
    raise ValueError(f"Unsupported sample width: {sampwidth}")


def trim_mono(samples, threshold=0.0008):
    start = 0
    end = len(samples)
    while start < end and abs(samples[start]) < threshold:
        start += 1
    while end > start and abs(samples[end - 1]) < threshold:
        end -= 1
    if start >= end:
        return array("f", [0.0])
    return array("f", samples[start:end])


def load_sample_asset(path):
    if path in SAMPLE_CACHE:
        return SAMPLE_CACHE[path]

    with wave.open(path, "rb") as wav_file:
        channels = wav_file.getnchannels()
        sampwidth = wav_file.getsampwidth()
        framerate = wav_file.getframerate()
        raw = wav_file.readframes(wav_file.getnframes())

    frame_size = channels * sampwidth
    total_frames = len(raw) // frame_size
    mono = array("f", [0.0]) * total_frames
    for frame_idx in range(total_frames):
        base = frame_idx * frame_size
        total = 0.0
        for ch in range(channels):
            total += decode_pcm_sample(raw, base + ch * sampwidth, sampwidth)
        mono[frame_idx] = total / max(channels, 1)

    mono = trim_mono(mono)
    peak = max((abs(sample) for sample in mono), default=1e-6)
    if peak > 1e-6:
        scale = 0.98 / peak
        for i in range(len(mono)):
            mono[i] *= scale

    SAMPLE_CACHE[path] = {
        "samples": mono,
        "rate": framerate,
    }
    return SAMPLE_CACHE[path]


def choose_sample_entry(bank_name, target_note=None):
    entries = SAMPLE_BANKS[bank_name]
    if not target_note:
        return random.choice(entries)

    target_freq = note_to_freq(target_note)
    best_entry = None
    best_distance = 999.0
    for entry in entries:
        source_note = entry.get("note")
        if not source_note:
            continue
        distance = note_distance(target_freq, note_to_freq(source_note))
        if distance < best_distance:
            best_distance = distance
            best_entry = entry
    return best_entry if best_entry else random.choice(entries)


def mix_mono(target, source, start_index=0):
    needed = start_index + len(source) - len(target)
    if needed > 0:
        target.extend([0.0] * needed)
    for i, sample in enumerate(source):
        target[start_index + i] += sample


def render_sample_voice(bank_name, target_note=None, duration=None, gain=1.0, attack=0.005, release=0.08):
    entry = choose_sample_entry(bank_name, target_note)
    asset = load_sample_asset(entry["path"])
    src = asset["samples"]
    src_rate = asset["rate"]

    source_note = entry.get("note")
    pitch_ratio = 1.0
    if source_note and target_note:
        pitch_ratio = note_to_freq(target_note) / note_to_freq(source_note)

    playback_seconds = len(src) / max(src_rate, 1) / max(pitch_ratio, 1e-6)
    if duration is None:
        duration = max(0.02, playback_seconds - release * 0.4)
    total_seconds = min(playback_seconds, duration + release)
    out = array("f", [0.0]) * max(1, int(total_seconds * SAMPLE_RATE))
    step = pitch_ratio * src_rate / SAMPLE_RATE

    for i in range(len(out)):
        t = i / SAMPLE_RATE
        src_pos = i * step
        if src_pos >= len(src) - 1:
            break
        src_idx = int(src_pos)
        frac = src_pos - src_idx
        sample = src[src_idx] * (1.0 - frac) + src[src_idx + 1] * frac

        if attack > 0.0 and t < attack:
            amp = t / max(attack, 1e-6)
        elif t > duration:
            amp = max(0.0, 1.0 - (t - duration) / max(release, 1e-6))
        else:
            amp = 1.0
        out[i] = sample * gain * amp

    return out


def render_sample_stack(bank_name, notes, duration, gain=1.0, attack=0.005, release=0.12, stagger=0.0):
    total_seconds = duration + release + stagger * max(0, len(notes) - 1)
    out = array("f", [0.0]) * max(1, int(total_seconds * SAMPLE_RATE))
    voice_gain = gain / max(1.0, len(notes) ** 0.82)
    for idx, note in enumerate(notes):
        voice = render_sample_voice(bank_name, target_note=note, duration=duration, gain=voice_gain, attack=attack, release=release)
        mix_mono(out, voice, int(stagger * idx * SAMPLE_RATE))
    return out


def ensure_gm_sound_font():
    global GM_SOUND_FONT

    if ms is None:
        raise RuntimeError("py-meltysynth is unavailable")
    if GM_SOUND_FONT is None:
        GM_SOUND_FONT = ms.SoundFont.from_file(GM_SOUND_FONT_PATH)
    return GM_SOUND_FONT


def render_gm_event(program_key, notes, duration, velocity=90, release=0.2, gain=1.0, bank=0):
    if isinstance(notes, str):
        notes = [notes]

    note_tuple = tuple(notes)
    cache_key = (
        program_key,
        note_tuple,
        round(duration, 4),
        velocity,
        round(release, 4),
        round(gain, 4),
        bank,
    )
    if cache_key in GM_RENDER_CACHE:
        return GM_RENDER_CACHE[cache_key]

    sound_font = ensure_gm_sound_font()
    settings = ms.SynthesizerSettings(SAMPLE_RATE)
    settings.block_size = 128
    settings.maximum_polyphony = 96
    settings.enable_reverb_and_chorus = False
    synth = ms.Synthesizer(sound_font, settings)

    synth.process_midi_message(0, 0xB0, 0x00, bank)
    synth.process_midi_message(0, 0xC0, GM_PROGRAMS[program_key], 0)

    midi_keys = [note_to_midi(note) for note in note_tuple]
    on_samples = max(1, int(duration * SAMPLE_RATE))
    off_samples = max(1, int(release * SAMPLE_RATE))
    total_samples = on_samples + off_samples
    left = ms.create_buffer(total_samples)
    right = ms.create_buffer(total_samples)

    for key in midi_keys:
        synth.note_on(0, key, velocity)
    synth.render(left, right, 0, on_samples)
    for key in midi_keys:
        synth.note_off(0, key)
    synth.render(left, right, on_samples, off_samples)

    mono = array("f", [0.0]) * total_samples
    peak = 1e-6
    for i in range(total_samples):
        sample = (left[i] + right[i]) * 0.5 * gain
        mono[i] = sample
        peak = max(peak, abs(sample))

    if peak > 0.92:
        scale = 0.92 / peak
        for i in range(total_samples):
            mono[i] *= scale

    GM_RENDER_CACHE[cache_key] = mono
    return mono


def render_gm_note(program_key, note, duration, velocity=90, release=0.2, gain=1.0, bank=0):
    return render_gm_event(program_key, [note], duration, velocity=velocity, release=release, gain=gain, bank=bank)


def render_gm_chord(program_key, notes, duration, velocity=84, release=0.28, gain=1.0, bank=0):
    return render_gm_event(program_key, notes, duration, velocity=velocity, release=release, gain=gain, bank=bank)


def env(progress, attack, decay, sustain_level, sustain_time, release):
    if progress < attack:
        return progress / max(attack, 1e-6)
    progress -= attack
    if progress < decay:
        ratio = progress / max(decay, 1e-6)
        return 1.0 + (sustain_level - 1.0) * ratio
    progress -= decay
    if progress < sustain_time:
        return sustain_level
    progress -= sustain_time
    if progress < release:
        return sustain_level * (1.0 - progress / max(release, 1e-6))
    return 0.0


def circular_add(left, right, start_index, mono_samples, pan=0.0):
    left_gain = math.sqrt((1.0 - pan) * 0.5)
    right_gain = math.sqrt((1.0 + pan) * 0.5)
    total = len(left)
    for i, sample in enumerate(mono_samples):
        idx = (start_index + i) % total
        left[idx] += sample * left_gain
        right[idx] += sample * right_gain


def make_noise():
    return random.uniform(-1.0, 1.0)


def synth_pad(freqs, duration, tone=0.5):
    samples = int((duration + 0.3) * SAMPLE_RATE)
    out = array("f", [0.0]) * samples
    detunes = [0.996, 1.0, 1.003]
    voice_count = max(len(freqs) * len(detunes), 1)
    for i in range(samples):
        t = i / SAMPLE_RATE
        amp = env(t, 0.09, 0.4, 0.56, max(0.0, duration - 0.9), 0.5) * 0.18
        sweep = 0.86 + 0.14 * math.sin(2 * math.pi * 0.21 * t)
        sample = 0.0
        for freq in freqs:
            for det in detunes:
                phase = 2 * math.pi * freq * det * t
                sample += math.sin(phase) * 0.26
                sample += math.sin(phase * 2.0) * 0.09 * tone
                sample += math.sin(phase * 0.5) * 0.05
        out[i] = sample * sweep * amp / voice_count
    return out


def synth_support(freqs, duration, tone=0.6, level=1.0):
    samples = int((duration + 0.25) * SAMPLE_RATE)
    out = array("f", [0.0]) * samples
    for i in range(samples):
        t = i / SAMPLE_RATE
        amp = env(t, 0.12, 0.3, 0.72, max(0.0, duration - 0.8), 0.46) * 0.18 * level
        sample = 0.0
        for idx, freq in enumerate(freqs):
            phase = 2 * math.pi * freq * t
            sample += math.sin(phase) * (0.46 if idx == 0 else 0.3)
            sample += math.sin(phase * 2.0) * 0.05 * tone
            sample += math.sin(phase * 0.5) * 0.04
        out[i] = sample * amp / max(len(freqs), 1)
    return out


def synth_bass(freq, duration, drive=1.0):
    samples = int((duration + 0.08) * SAMPLE_RATE)
    out = array("f", [0.0]) * samples
    for i in range(samples):
        t = i / SAMPLE_RATE
        amp = env(t, 0.003, 0.06, 0.62, max(0.0, duration - 0.12), 0.06) * 0.34
        phase = 2 * math.pi * freq * t
        saw = 2.0 * ((freq * t) % 1.0) - 1.0
        edge = 0.08 + min(drive, 1.4) * 0.04
        sample = math.sin(phase) * 0.72 + saw * edge + math.sin(phase * 0.5) * 0.12
        punch = math.exp(-14.0 * t)
        sample += math.sin(2 * math.pi * freq * 2.0 * t) * 0.045 * min(drive, 1.25) * punch
        out[i] = sample * amp * 0.82
    return out


def synth_lead(freq, duration, tone=1.0, style="sharp", vibrato_depth=0.003, vibrato_rate=5.4):
    samples = int((duration + 0.1) * SAMPLE_RATE)
    out = array("f", [0.0]) * samples
    for i in range(samples):
        t = i / SAMPLE_RATE
        amp = env(t, 0.006, 0.05, 0.48, max(0.0, duration - 0.14), 0.1) * 0.23
        vibrato = math.sin(2 * math.pi * vibrato_rate * t) * vibrato_depth * freq
        phase = 2 * math.pi * (freq + vibrato) * t
        if style == "soft":
            sample = math.sin(phase) * 0.7 + math.sin(phase * 2.0) * 0.12 * tone
        elif style == "pure":
            sample = math.sin(phase) * 0.8 + math.sin(phase * 2.0) * 0.07 * tone
        elif style == "bell":
            sample = math.sin(phase) * 0.52 + math.sin(phase * 2.7) * 0.2 + math.sin(phase * 4.1) * 0.1
        else:
            saw = 2.0 * ((freq * t) % 1.0) - 1.0
            sample = math.sin(phase) * 0.6 + saw * 0.16 + math.sin(phase * 2.0) * 0.1 * tone
        out[i] = sample * amp * 0.9
    return out


def synth_pluck(freq, duration=0.18, brilliance=1.0):
    samples = int(duration * SAMPLE_RATE)
    out = array("f", [0.0]) * samples
    for i in range(samples):
        t = i / SAMPLE_RATE
        amp = math.exp(-18.0 * t) * 0.16
        sample = math.sin(2 * math.pi * freq * t) * 0.55
        sample += math.sin(2 * math.pi * freq * 2.0 * t) * 0.18 * brilliance
        sample += make_noise() * 0.13
        out[i] = sample * amp
    return out


def synth_kick(duration=0.3, body=1.0, gain=1.0):
    samples = int(duration * SAMPLE_RATE)
    out = array("f", [0.0]) * samples
    for i in range(samples):
        t = i / SAMPLE_RATE
        freq = (145.0 * body) * (0.22 ** min(t / duration, 1.0)) + 38.0
        amp = math.exp(-9.8 * t) * 0.68
        sample = math.sin(2 * math.pi * freq * t)
        sample += math.sin(2 * math.pi * freq * 0.5 * t) * 0.12
        sample += make_noise() * math.exp(-90.0 * t) * 0.012
        out[i] = sample * amp * 0.24 * gain
    return out


def synth_tom(freq=120.0, duration=0.22, gain=1.0):
    samples = int(duration * SAMPLE_RATE)
    out = array("f", [0.0]) * samples
    for i in range(samples):
        t = i / SAMPLE_RATE
        amp = math.exp(-8.4 * t) * 0.22
        f = freq * (0.5 ** min(t / duration, 1.0)) + 40.0
        sample = math.sin(2 * math.pi * f * t) + math.sin(2 * math.pi * f * 0.5 * t) * 0.18
        out[i] = sample * amp * 0.62 * gain
    return out


def synth_snare(duration=0.17, brightness=1.0, gain=1.0):
    samples = int(duration * SAMPLE_RATE)
    out = array("f", [0.0]) * samples
    for i in range(samples):
        t = i / SAMPLE_RATE
        amp = math.exp(-21.0 * t) * 0.18
        noise = make_noise() * 0.68
        tone = math.sin(2 * math.pi * 190.0 * t) * 0.14
        out[i] = (noise * brightness + tone) * amp * gain
    return out


def synth_hat(duration=0.07, brightness=1.0, gain=1.0):
    samples = int(duration * SAMPLE_RATE)
    out = array("f", [0.0]) * samples
    for i in range(samples):
        t = i / SAMPLE_RATE
        amp = math.exp(-52.0 * t) * 0.07
        noise = make_noise() * 0.64
        metal = math.sin(2 * math.pi * 6200.0 * brightness * t) * 0.12
        out[i] = (noise + metal) * amp * gain
    return out


def normalize(left, right):
    peak = 1e-6
    for buf in (left, right):
        for sample in buf:
            peak = max(peak, abs(sample))
    scale = min(1.0, MASTER_GAIN / peak)
    for buf in (left, right):
        for i in range(len(buf)):
            buf[i] *= scale


def write_wav(path, left, right):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    normalize(left, right)
    with wave.open(path, "wb") as wav_file:
        wav_file.setnchannels(2)
        wav_file.setsampwidth(2)
        wav_file.setframerate(SAMPLE_RATE)
        frames = bytearray()
        for l_sample, r_sample in zip(left, right):
            li = max(-32767, min(32767, int(l_sample * 32767.0)))
            ri = max(-32767, min(32767, int(r_sample * 32767.0)))
            frames += struct.pack("<hh", li, ri)
        wav_file.writeframes(frames)


def sec_to_idx(seconds):
    return int(seconds * SAMPLE_RATE)


def add_note(left, right, beat_seconds, start_beats, sound, pan=0.0):
    start_index = sec_to_idx(start_beats * beat_seconds)
    circular_add(left, right, start_index, sound, pan=pan)


def build_qi_theme(left, right, spec):
    beat_seconds = 60.0 / spec["tempo"]
    triplet = 1.0 / 3.0

    for bar in range(TOTAL_BARS):
        freqs = [note_to_freq(note) for note in spec["chords"][bar]]
        if is_gm_profile():
            pad_sound = render_gm_chord("qi_pad", spec["chords"][bar], beat_seconds * 3.65, velocity=76, release=0.36, gain=0.56)
        else:
            pad_sound = synth_pad(freqs, beat_seconds * 4, spec["pad_tone"])
        add_note(left, right, beat_seconds, bar * 4, pad_sound, pan=(-0.05 if bar % 2 == 0 else 0.05))

        root = note_to_freq(spec["chords"][bar][0])
        bass_hits = [0.0, 1.5, 2.0]
        if bar in (3, 7, 11, 15):
            bass_hits = [0.0, 1.0, 2.0, 2.0 + triplet, 2.0 + triplet * 2]
        for idx, beat in enumerate(bass_hits):
            duration = 0.55 if idx == 0 else 0.38
            if is_gm_profile():
                bass_note = spec["chords"][bar][0] if idx % 2 == 0 else spec["chords"][bar][1]
                bass_sound = render_gm_note("qi_bass", bass_note, beat_seconds * duration, velocity=60, release=0.08, gain=0.42)
                add_note(left, right, beat_seconds, bar * 4 + beat, bass_sound, pan=-0.04)
            else:
                add_note(left, right, beat_seconds, bar * 4 + beat, synth_bass(root * (1.0 if idx % 2 == 0 else 1.5), beat_seconds * duration, drive=1.15), pan=-0.04)

        motif = spec["motif"]
        qi_patterns = {
            0: [(0.0, 3.1), (3.25, 0.45)],
            1: [(0.5, 1.1), (2.0, 1.25)],
            2: [(0.0, 1.6), (2.0, 1.3)],
            3: [(0.0, 2.0), (2.0 + triplet, 0.42), (2.0 + triplet * 2, 0.42)],
        }
        pattern = qi_patterns[bar % 4]
        for n_idx, (beat, dur_beats) in enumerate(pattern):
            note = motif[(bar * 2 + n_idx) % len(motif)]
            duration = beat_seconds * dur_beats
            if is_gm_profile():
                sound = render_gm_note("qi_lead", note, duration, velocity=94, release=0.22, gain=0.84)
            elif is_sample_profile():
                sound = render_sample_voice("ocarina", target_note=note, duration=duration, gain=0.5, attack=0.012, release=0.1)
            else:
                sound = synth_lead(note_to_freq(note), duration, tone=spec["lead_tone"], style="pure", vibrato_depth=0.0007, vibrato_rate=4.4)
            add_note(left, right, beat_seconds, bar * 4 + beat, sound, pan=random.uniform(-0.04, 0.04))

        if bar >= 8:
            if is_gm_profile():
                support_sound = render_gm_chord("qi_support", [spec["chords"][bar][0], spec["chords"][bar][2], spec["chords"][bar][3]], beat_seconds * 3.6, velocity=74, release=0.42, gain=0.52)
            else:
                support = [
                    note_to_freq(spec["counter"][bar % len(spec["counter"])]),
                    note_to_freq(spec["chords"][bar][2]),
                    note_to_freq(spec["chords"][bar][3]),
                ]
                support_sound = synth_support(support, beat_seconds * 4, tone=0.6, level=1.35)
            add_note(left, right, beat_seconds, bar * 4, support_sound, pan=0.0)

        for beat in [0.0, 2.0]:
            if is_sample_profile():
                sound = render_sample_voice("frame_drum_low", duration=0.42, gain=0.78, attack=0.001, release=0.08)
            else:
                sound = synth_kick(body=1.08, gain=0.52)
            add_note(left, right, beat_seconds, bar * 4 + beat, sound, pan=0.0)
        if bar in (3, 7, 11, 15):
            if is_sample_profile():
                add_note(left, right, beat_seconds, bar * 4 + 2.0 + triplet, render_sample_voice("frame_drum_small", duration=0.2, gain=0.46, attack=0.001, release=0.05), pan=-0.1)
                add_note(left, right, beat_seconds, bar * 4 + 2.0 + triplet * 2, render_sample_voice("frame_drum_small", duration=0.2, gain=0.52, attack=0.001, release=0.05), pan=0.1)
            else:
                add_note(left, right, beat_seconds, bar * 4 + 2.0 + triplet, synth_tom(165.0, gain=0.4), pan=-0.1)
                add_note(left, right, beat_seconds, bar * 4 + 2.0 + triplet * 2, synth_tom(120.0, gain=0.42), pan=0.1)
        if is_sample_profile():
            add_note(left, right, beat_seconds, bar * 4 + 3.0, render_sample_voice("frame_drum_low", duration=0.26, gain=0.36, attack=0.001, release=0.05), pan=0.0)
            if bar in (0, 4, 8, 12):
                add_note(left, right, beat_seconds, bar * 4, render_sample_voice("gong", duration=1.25, gain=0.16, attack=0.002, release=0.3), pan=0.0)
        else:
            add_note(left, right, beat_seconds, bar * 4 + 3.0, synth_snare(brightness=0.78, gain=0.42), pan=0.0)

        if bar >= 4:
            for beat in [1.0, 1.5, 2.5, 3.5]:
                add_note(left, right, beat_seconds, bar * 4 + beat, synth_hat(brightness=0.78, gain=0.3), pan=random.uniform(-0.06, 0.06))


def build_combo_theme(left, right, spec):
    beat_seconds = 60.0 / spec["tempo"]
    motif = spec["motif"]

    for bar in range(TOTAL_BARS):
        freqs = [note_to_freq(note) for note in spec["chords"][bar]]
        if bar % 4 in (0, 2):
            if is_gm_profile():
                pad_sound = render_gm_chord("combo_pad", spec["chords"][bar], beat_seconds * 3.45, velocity=72, release=0.34, gain=0.44)
            else:
                pad_sound = synth_pad(freqs, beat_seconds * 4, spec["pad_tone"])
            add_note(left, right, beat_seconds, bar * 4, pad_sound, pan=(-0.08 if bar % 2 == 0 else 0.08))

        root = note_to_freq(spec["chords"][bar][0])
        pair_phase = bar % 2
        bass_patterns = {
            0: [(0.0, 0.22), (0.5, 0.2), (1.0, 0.2), (1.5, 0.2), (2.0, 0.22), (2.5, 0.2), (3.0, 0.24)],
            1: [(0.0, 0.2), (0.5, 0.18), (1.0, 0.18), (1.5, 0.22), (3.0, 0.26), (3.5, 0.34)],
        }
        for idx, (beat, dur_beats) in enumerate(bass_patterns[pair_phase]):
            if pair_phase == 1 and beat >= 3.0:
                note_freq = root
                drive = 1.58
            else:
                note_freq = root * (1.0 if idx % 3 != 1 else 1.5)
                drive = 1.28
            add_note(left, right, beat_seconds, bar * 4 + beat, synth_bass(note_freq, beat_seconds * dur_beats, drive=drive), pan=-0.03)

        melodic_patterns = {
            0: [(0.0, 0.14), (0.25, 0.14), (0.5, 0.14), (0.75, 0.14), (1.5, 0.16), (2.0, 0.16), (2.5, 0.16), (3.0, 0.2)],
            1: [(0.0, 0.14), (0.25, 0.14), (0.5, 0.14), (1.0, 0.16), (1.5, 0.18), (3.0, 0.24), (3.5, 0.8)],
        }
        pattern = melodic_patterns[pair_phase]
        for idx, (beat, dur_beats) in enumerate(pattern):
            if pair_phase == 1 and beat == 3.5:
                heavy_root = spec["chords"][bar][0][:-1] + "4"
                note = heavy_root
                style = "pure"
                tone = spec["lead_tone"] * 1.02
            else:
                note = motif[(bar * 4 + idx) % len(motif)]
                style = "sharp"
                tone = spec["lead_tone"]
            duration = beat_seconds * dur_beats
            if is_gm_profile():
                gain = 1.1 if pair_phase == 1 and beat == 3.5 else 0.96
                velocity = 108 if pair_phase == 1 and beat == 3.5 else 98
                sound = render_gm_note("combo_lead", note, duration, velocity=velocity, release=0.14, gain=gain)
            elif is_sample_profile():
                gain = 0.42 if pair_phase == 1 and beat == 3.5 else 0.34
                sound = render_sample_voice("strumstick", target_note=note, duration=duration, gain=gain, attack=0.001, release=0.09)
            else:
                sound = synth_lead(note_to_freq(note), duration, tone=tone, style=style, vibrato_depth=0.0012)
            add_note(left, right, beat_seconds, bar * 4 + beat, sound, pan=random.uniform(-0.08, 0.08))

        if bar >= 8:
            if is_gm_profile():
                support_notes = [
                    spec["chords"][bar][1],
                    spec["chords"][bar][2],
                    spec["chords"][bar][3],
                ]
                sound = render_gm_chord("combo_support", support_notes, beat_seconds * 3.1, velocity=74, release=0.34, gain=0.34)
            elif is_sample_profile():
                support_notes = [
                    spec["chords"][bar][0],
                    spec["chords"][bar][2],
                    spec["chords"][bar][3],
                ]
                sound = render_sample_stack("folk_harp", support_notes, beat_seconds * 1.45, gain=0.5, attack=0.002, release=0.16, stagger=0.03)
            else:
                support_notes = [
                    note_to_freq(spec["chords"][bar][0]),
                    note_to_freq(spec["chords"][bar][1]),
                    note_to_freq(spec["chords"][bar][2]),
                    note_to_freq(spec["chords"][bar][3]),
                ]
                sound = synth_support(support_notes, beat_seconds * 4, tone=0.9, level=2.25)
            add_note(left, right, beat_seconds, bar * 4, sound, pan=0.0)

        kick_patterns = {
            0: [0.0, 1.0, 2.0, 3.0],
            1: [0.0, 1.5, 3.0, 3.5],
        }
        snare_patterns = {
            0: [1.5, 3.0],
            1: [1.0],
        }
        hat_patterns = {
            0: [0.0, 0.25, 0.5, 0.75, 1.5, 2.0, 2.5, 3.5],
            1: [0.0, 0.5, 1.0, 1.25, 1.5, 3.0, 3.5],
        }
        for beat in kick_patterns[pair_phase]:
            if is_sample_profile():
                body_gain = 0.6 if pair_phase == 0 else 0.72
                sound = render_sample_voice("frame_drum_low", duration=0.34, gain=body_gain, attack=0.001, release=0.06)
            else:
                sound = synth_kick(body=0.96 if pair_phase == 0 else 1.06, gain=0.46 if pair_phase == 0 else 0.52)
            add_note(left, right, beat_seconds, bar * 4 + beat, sound, pan=0.0)
        for beat in snare_patterns[pair_phase]:
            if is_sample_profile():
                sound = render_sample_voice("frame_drum_small", duration=0.22, gain=0.36, attack=0.001, release=0.04)
            else:
                sound = synth_snare(brightness=0.82, gain=0.4)
            add_note(left, right, beat_seconds, bar * 4 + beat, sound, pan=0.0)
        if pair_phase == 1:
            for beat in [3.0, 3.5]:
                if is_sample_profile():
                    sound = render_sample_voice("frame_drum_low", duration=0.24, gain=0.44, attack=0.001, release=0.05)
                else:
                    sound = synth_tom(88.0, duration=0.28, gain=0.36)
                add_note(left, right, beat_seconds, bar * 4 + beat, sound, pan=0.0)
        for beat in hat_patterns[pair_phase]:
            add_note(left, right, beat_seconds, bar * 4 + beat, synth_hat(brightness=0.88, gain=0.28), pan=random.uniform(-0.08, 0.08))


def build_mana_theme(left, right, spec):
    beat_seconds = 60.0 / spec["tempo"]
    motif = spec["motif"]

    for bar in range(TOTAL_BARS):
        freqs = [note_to_freq(note) for note in spec["chords"][bar]]
        if is_gm_profile():
            pad_sound = render_gm_chord("mana_pad", spec["chords"][bar], beat_seconds * 3.85, velocity=68, release=0.5, gain=0.5)
        else:
            pad_sound = synth_pad(freqs, beat_seconds * 4, spec["pad_tone"])
        add_note(left, right, beat_seconds, bar * 4, pad_sound, pan=(-0.12 if bar % 2 == 0 else 0.12))

        root = note_to_freq(spec["chords"][bar][0])
        bass_patterns = {
            0: [0.0, 1.5, 3.0],
            1: [0.5, 1.25, 2.75],
            2: [0.0, 2.0, 3.25],
            3: [0.75, 1.5, 2.5],
        }
        pulse_hits = bass_patterns[bar % 4]
        for idx, beat in enumerate(pulse_hits):
            duration = 0.65 if idx == 0 and bar % 4 in (0, 2) else 0.34
            if is_gm_profile():
                bass_note = spec["chords"][bar][0] if idx % 2 == 0 else spec["chords"][bar][1]
                bass_sound = render_gm_note("mana_bass", bass_note, beat_seconds * duration, velocity=58, release=0.08, gain=0.38)
                add_note(left, right, beat_seconds, bar * 4 + beat, bass_sound, pan=-0.02)
            else:
                add_note(left, right, beat_seconds, bar * 4 + beat, synth_bass(root * (1.0 if idx % 2 == 0 else 0.75), beat_seconds * duration, drive=1.0), pan=-0.02)

        chord_notes = spec["chords"][bar]
        arp_patterns = {
            0: [0.0, 1.0, 2.5, 3.25],
            1: [0.25, 0.75, 1.5, 2.0, 3.0],
            2: [0.0, 0.5, 1.75, 2.5, 3.5],
            3: [0.75, 1.25, 2.0, 2.75, 3.25],
        }
        arp_pattern = arp_patterns[bar % 4]
        for idx, beat in enumerate(arp_pattern):
            note = chord_notes[idx % len(chord_notes)]
            octave_shift = 1 if idx % 3 == 0 else 2
            pitch = note[:-1] + str(int(note[-1]) + octave_shift)
            pluck_duration = 0.26 if bar % 4 in (0, 3) and idx == 0 else 0.18
            if is_gm_profile():
                sound = render_gm_note("mana_arp", pitch, beat_seconds * pluck_duration, velocity=80, release=0.1, gain=0.28)
            elif is_sample_profile():
                sound = render_sample_voice("clavisynth", target_note=pitch, duration=beat_seconds * pluck_duration, gain=0.26, attack=0.001, release=0.05)
            else:
                sound = synth_pluck(note_to_freq(pitch), duration=pluck_duration, brilliance=1.35)
            add_note(left, right, beat_seconds, bar * 4 + beat, sound, pan=random.uniform(-0.18, 0.18))

        phrase_patterns = {
            0: [(0.5, 0.95), (2.75, 0.5)],
            1: [(1.0, 0.42), (3.0, 0.7)],
            2: [(0.0, 0.8), (2.25, 0.42), (3.25, 0.34)],
            3: [(1.5, 0.55), (3.25, 0.42)],
        }
        for idx, (beat, dur_beats) in enumerate(phrase_patterns[bar % 4]):
            note = motif[(bar * 2 + idx) % len(motif)]
            style = "bell" if bar % 4 in (1, 3) else "soft"
            duration = beat_seconds * dur_beats
            if is_gm_profile():
                sound = render_gm_note("mana_lead", note, duration, velocity=100, release=0.2, gain=0.98)
            elif is_sample_profile():
                bank_name = "hand_chimes" if style == "bell" else "clavisynth"
                gain = 0.26 if style == "bell" else 0.3
                sound = render_sample_voice(bank_name, target_note=note, duration=duration, gain=gain, attack=0.004, release=0.08)
            else:
                sound = synth_lead(note_to_freq(note), duration, tone=spec["lead_tone"], style=style)
            add_note(left, right, beat_seconds, bar * 4 + beat, sound, pan=random.uniform(-0.15, 0.15))

        if bar >= 8:
            if is_gm_profile():
                support_notes = [
                    spec["chords"][bar][1],
                    spec["chords"][bar][2],
                    spec["chords"][bar][3],
                ]
                sound = render_gm_chord("mana_support", support_notes, beat_seconds * 3.7, velocity=66, release=0.46, gain=0.34)
            elif is_sample_profile():
                support_notes = [
                    spec["chords"][bar][1],
                    spec["chords"][bar][2],
                    spec["chords"][bar][3],
                ]
                sound = render_sample_stack("hand_chimes", support_notes, beat_seconds * 1.8, gain=0.72, attack=0.004, release=0.22, stagger=0.06)
            else:
                support_notes = [
                    note_to_freq(spec["chords"][bar][0]),
                    note_to_freq(spec["chords"][bar][1]),
                    note_to_freq(spec["chords"][bar][2]),
                    note_to_freq(spec["chords"][bar][3]),
                ]
                sound = synth_support(support_notes, beat_seconds * 4, tone=1.0, level=1.7)
            add_note(left, right, beat_seconds, bar * 4, sound, pan=0.0)

        kick_patterns = {
            0: [0.0, 2.5],
            1: [0.5, 2.0],
            2: [0.0, 1.75, 3.0],
            3: [0.75, 2.5],
        }
        snare_patterns = {
            0: [1.75],
            1: [3.0],
            2: [2.75],
            3: [1.5, 3.25],
        }
        hat_patterns = {
            0: [0.5, 1.5, 2.0, 3.5],
            1: [0.25, 1.0, 2.25, 3.0],
            2: [0.75, 1.25, 2.5, 3.5],
            3: [0.5, 1.75, 2.75, 3.25],
        }
        for beat in kick_patterns[bar % 4]:
            add_note(left, right, beat_seconds, bar * 4 + beat, synth_kick(body=0.92, gain=0.42), pan=0.0)
        for beat in snare_patterns[bar % 4]:
            add_note(left, right, beat_seconds, bar * 4 + beat, synth_snare(brightness=0.8, gain=0.36), pan=0.0)
        for beat in hat_patterns[bar % 4]:
            add_note(left, right, beat_seconds, bar * 4 + beat, synth_hat(brightness=0.92, gain=0.24), pan=random.uniform(-0.1, 0.1))


def build_balance_theme(left, right, spec):
    beat_seconds = 60.0 / spec["tempo"]

    for bar in range(TOTAL_BARS):
        freqs = [note_to_freq(note) for note in spec["chords"][bar]]
        if is_gm_profile():
            pad_sound = render_gm_chord("balance_pad", spec["chords"][bar], beat_seconds * 3.75, velocity=70, release=0.44, gain=0.48)
        else:
            pad_sound = synth_pad(freqs, beat_seconds * 4, spec["pad_tone"])
        add_note(left, right, beat_seconds, bar * 4, pad_sound, pan=(-0.04 if bar % 2 == 0 else 0.04))

        root = note_to_freq(spec["chords"][bar][0])
        cycle_phase = bar % 4
        bass_patterns = {
            0: [(0.0, 0.5), (1.75, 0.3), (3.0, 0.5)],
            1: [(0.5, 0.36), (1.5, 0.36), (3.0, 0.46)],
            2: [(0.0, 0.46), (2.0, 0.36), (3.25, 0.4)],
            3: [(0.75, 0.4), (2.25, 0.36), (3.0, 0.5)],
        }
        for idx, (beat, dur_beats) in enumerate(bass_patterns[cycle_phase]):
            if is_gm_profile():
                bass_note = spec["chords"][bar][0] if idx != 1 else spec["chords"][bar][1]
                bass_sound = render_gm_note("balance_bass", bass_note, beat_seconds * dur_beats, velocity=58, release=0.08, gain=0.42)
                add_note(left, right, beat_seconds, bar * 4 + beat, bass_sound, pan=-0.03)
            else:
                note_freq = root * (1.0 if idx != 1 else 1.5)
                add_note(left, right, beat_seconds, bar * 4 + beat, synth_bass(note_freq, beat_seconds * dur_beats, drive=0.92), pan=-0.03)

        melody_map = {
            0: [("D4", 0.0, 0.7), ("A4", 1.5, 0.55), ("F#4", 3.0, 0.75)],
            1: [("E4", 0.5, 0.6), ("B4", 1.75, 0.5), ("A4", 3.0, 0.8)],
            2: [("B4", 0.0, 0.75), ("E4", 1.75, 0.6), ("A4", 3.0, 0.85)],
            3: [("F#5", 0.5, 0.65), ("D5", 1.75, 0.55), ("E5", 3.0, 0.85)],
        }
        for note, beat, dur_beats in melody_map[cycle_phase]:
            duration = beat_seconds * dur_beats
            if is_gm_profile():
                sound = render_gm_note("balance_lead", note, duration, velocity=88, release=0.16, gain=0.82)
            elif is_sample_profile():
                sound = render_sample_voice("folk_harp", target_note=note, duration=duration, gain=0.34, attack=0.002, release=0.12)
            else:
                sound = synth_lead(note_to_freq(note), duration, tone=spec["lead_tone"] * 0.96, style="soft", vibrato_depth=0.001)
            add_note(left, right, beat_seconds, bar * 4 + beat, sound, pan=(-0.08 if cycle_phase < 2 else 0.08))

        if bar >= 8:
            if is_gm_profile():
                support_notes = [
                    spec["chords"][bar][0],
                    spec["chords"][bar][2],
                    spec["chords"][bar][3],
                ]
                sound = render_gm_chord("balance_support", support_notes, beat_seconds * 3.8, velocity=64, release=0.38, gain=0.3)
            elif is_sample_profile():
                support_notes = [
                    spec["chords"][bar][0],
                    spec["chords"][bar][2],
                    spec["chords"][bar][3],
                ]
                sound = render_sample_stack("hand_chimes", support_notes, beat_seconds * 1.9, gain=0.68, attack=0.004, release=0.22, stagger=0.08)
            else:
                support_notes = [
                    note_to_freq(spec["chords"][bar][0]),
                    note_to_freq(spec["chords"][bar][2]),
                    note_to_freq(spec["chords"][bar][3]),
                ]
                sound = synth_support(support_notes, beat_seconds * 4, tone=0.74, level=1.9)
            add_note(left, right, beat_seconds, bar * 4, sound, pan=0.0)

        kick_patterns = {
            0: [0.0, 2.0],
            1: [0.5, 2.5],
            2: [0.0, 1.75, 3.0],
            3: [0.75, 2.25],
        }
        snare_patterns = {
            0: [1.5],
            1: [3.0],
            2: [1.75],
            3: [3.0],
        }
        hat_patterns = {
            0: [0.0, 0.75, 1.5, 2.75],
            1: [0.5, 1.25, 2.0, 3.0],
            2: [0.0, 1.0, 1.75, 3.0],
            3: [0.75, 1.5, 2.5, 3.25],
        }
        for beat in kick_patterns[cycle_phase]:
            if is_sample_profile():
                sound = render_sample_voice("frame_drum_low", duration=0.34, gain=0.46, attack=0.001, release=0.05)
            else:
                sound = synth_kick(body=0.88, gain=0.34)
            add_note(left, right, beat_seconds, bar * 4 + beat, sound, pan=0.0)
        for beat in snare_patterns[cycle_phase]:
            add_note(left, right, beat_seconds, bar * 4 + beat, synth_snare(brightness=0.7, gain=0.24), pan=0.0)
        for beat in hat_patterns[cycle_phase]:
            add_note(left, right, beat_seconds, bar * 4 + beat, synth_hat(brightness=0.72, gain=0.14), pan=random.uniform(-0.06, 0.06))
        if is_sample_profile() and bar in (0, 4, 8, 12):
            add_note(left, right, beat_seconds, bar * 4, render_sample_voice("gong", duration=1.0, gain=0.12, attack=0.002, release=0.28), pan=0.0)


def render_theme(name, spec, output_dir, version_suffix):
    beat_seconds = 60.0 / spec["tempo"]
    loop_seconds = beat_seconds * 4.0 * TOTAL_BARS
    total_samples = int(loop_seconds * SAMPLE_RATE)
    left = array("f", [0.0]) * total_samples
    right = array("f", [0.0]) * total_samples

    if name == "qi":
        build_qi_theme(left, right, spec)
    elif name == "combo":
        build_combo_theme(left, right, spec)
    elif name == "mana":
        build_mana_theme(left, right, spec)
    elif name == "balance":
        build_balance_theme(left, right, spec)
    else:
        raise ValueError(f"Unknown theme: {name}")

    path = os.path.join(output_dir, f"{name}_battle_loop_{version_suffix}.wav")
    write_wav(path, left, right)
    return path


def main():
    global CURRENT_PROFILE

    parser = argparse.ArgumentParser()
    parser.add_argument("--version", required=True)
    parser.add_argument("--themes", nargs="+", required=True)
    parser.add_argument("--profile", default="synth", choices=["synth", "sampled_v1", "gm_v1"])
    args = parser.parse_args()

    CURRENT_PROFILE = args.profile
    root = PROJECT_ROOT
    output_dir = os.path.join(root, "assets", "audio", "bgm")
    generated = []
    random.seed(17)

    for name in args.themes:
        if name not in THEMES:
            raise ValueError(f"Unknown theme name: {name}")
        generated.append(render_theme(name, THEMES[name], output_dir, args.version))

    print("Generated WAV files:")
    for path in generated:
        print(path)


if __name__ == "__main__":
    main()
