class ParticleSystem {
    static getLayer() {
        return document.getElementById("vfx-layer");
    }

    static createParticles(x, y, count, color) {
        const layer = this.getLayer();
        if (!layer) {
            return;
        }

        const total = typeof count === "number" ? count : 10;
        const particleColor = color || "#00d4ff";

        for (let index = 0; index < total; index += 1) {
            const particle = document.createElement("div");
            particle.className = "particle";
            particle.style.left = x + "px";
            particle.style.top = y + "px";
            particle.style.background = particleColor;
            particle.style.boxShadow = "0 0 10px " + particleColor;
            layer.appendChild(particle);

            const angle = (Math.PI * 2 * index) / total + Math.random() * 0.5;
            const distance = 20 + Math.random() * 36;
            const dx = Math.cos(angle) * distance;
            const dy = Math.sin(angle) * distance;

            particle.animate([
                { transform: "translate(0, 0) scale(1)", opacity: 1 },
                { transform: "translate(" + dx + "px, " + dy + "px) scale(0.15)", opacity: 0 }
            ], {
                duration: 420 + Math.random() * 140,
                easing: "cubic-bezier(.2,.7,.2,1)",
                fill: "forwards"
            }).onfinish = function () {
                particle.remove();
            };
        }
    }

    static showDamageNumber(x, y, damage, color, skillName, options) {
        const layer = this.getLayer();
        if (!layer) {
            return;
        }

        const settings = options || {};
        const tone = color || "#ff6b9d";
        const number = document.createElement("div");
        number.className = "damage-number";
        number.style.left = x + "px";
        number.style.top = y + "px";
        number.style.color = tone;
        number.style.fontSize = (settings.fontSize || 28) + "px";
        number.textContent = (skillName ? skillName + " " : "") + damage;
        layer.appendChild(number);

        number.animate([
            { transform: "translate(-50%, 0) scale(0.85)", opacity: 0 },
            { transform: "translate(-50%, -18px) scale(1)", opacity: 1, offset: 0.2 },
            { transform: "translate(-50%, -42px) scale(1.02)", opacity: 1, offset: 0.65 },
            { transform: "translate(-50%, -70px) scale(0.95)", opacity: 0 }
        ], {
            duration: settings.duration || 1000,
            easing: "ease-out",
            fill: "forwards"
        }).onfinish = function () {
            number.remove();
        };
    }

    static createImpact(x, y, type, baseColor) {
        const layer = this.getLayer();
        if (!layer) {
            return;
        }

        const configMap = {
            light: { count: 8, color: "#7fe9ff", size: 22 },
            heavy: { count: 18, color: "#ff8f5a", size: 34 },
            ultimate: { count: 24, color: "#ffd166", size: 42 },
            enemy: { count: 12, color: "#ff6b9d", size: 28 },
            buff: { count: 12, color: "#00ff88", size: 28 },
            normal: { count: 10, color: baseColor || "#ff6b9d", size: 26 }
        };

        const config = configMap[type] || configMap.normal;
        const ring = document.createElement("div");
        ring.className = "impact-ring";
        ring.style.left = x + "px";
        ring.style.top = y + "px";
        ring.style.color = config.color;
        ring.style.width = config.size + "px";
        ring.style.height = config.size + "px";
        ring.style.marginLeft = -(config.size / 2) + "px";
        ring.style.marginTop = -(config.size / 2) + "px";
        layer.appendChild(ring);

        ring.animate([
            { transform: "scale(0.25)", opacity: 0.9 },
            { transform: "scale(1.8)", opacity: 0 }
        ], {
            duration: 320,
            easing: "ease-out",
            fill: "forwards"
        }).onfinish = function () {
            ring.remove();
        };

        this.createParticles(x, y, config.count, config.color);
    }

    static createSlash(x, y, type, color) {
        const layer = this.getLayer();
        if (!layer) {
            return;
        }

        const presets = {
            light: { width: 150, height: 18, color: "#f3fbff", blur: 12 },
            heavy: { width: 200, height: 24, color: "#ff8f5a", blur: 18 },
            special: { width: 170, height: 20, color: "#ffd166", blur: 14 },
            enemy: { width: 170, height: 18, color: "#ff6b9d", blur: 14 }
        };

        const preset = presets[type] || presets.light;
        const slash = document.createElement("div");
        slash.className = "slash-effect";
        slash.style.left = x + "px";
        slash.style.top = y + "px";
        slash.style.width = preset.width + "px";
        slash.style.height = preset.height + "px";
        slash.style.marginLeft = -(preset.width / 2) + "px";
        slash.style.marginTop = -(preset.height / 2) + "px";
        slash.style.background = "linear-gradient(90deg, transparent, " + (color || preset.color) + ", transparent)";
        slash.style.boxShadow = "0 0 " + preset.blur + "px " + (color || preset.color);
        slash.style.transform = "rotate(" + (-18 + Math.random() * 36) + "deg)";
        layer.appendChild(slash);

        slash.animate([
            { opacity: 0, transform: slash.style.transform + " scaleX(0.4)" },
            { opacity: 1, transform: slash.style.transform + " scaleX(1.05)", offset: 0.35 },
            { opacity: 0, transform: slash.style.transform + " scaleX(1.18)" }
        ], {
            duration: 240,
            easing: "ease-out",
            fill: "forwards"
        }).onfinish = function () {
            slash.remove();
        };
    }

    static shakeScreen(intensity, duration) {
        const stage = document.querySelector(".battle-field");
        if (!stage) {
            return;
        }

        const strength = typeof intensity === "number" ? intensity : 6;
        const totalDuration = typeof duration === "number" ? duration : 260;
        const start = performance.now();

        function step(timestamp) {
            const progress = (timestamp - start) / totalDuration;
            if (progress >= 1) {
                stage.style.transform = "";
                return;
            }

            const fade = 1 - progress;
            const dx = (Math.random() - 0.5) * strength * fade;
            const dy = (Math.random() - 0.5) * strength * fade;
            stage.style.transform = "translate(" + dx + "px, " + dy + "px)";
            requestAnimationFrame(step);
        }

        requestAnimationFrame(step);
    }

    static flashScreen(color, duration) {
        const layer = this.getLayer();
        if (!layer) {
            return;
        }

        const flash = document.createElement("div");
        flash.className = "flash-overlay";
        flash.style.inset = "0";
        flash.style.background = color || "rgba(255,255,255,0.22)";
        flash.style.opacity = "0";
        layer.appendChild(flash);

        flash.animate([
            { opacity: 0 },
            { opacity: 0.9, offset: 0.2 },
            { opacity: 0 }
        ], {
            duration: duration || 180,
            easing: "ease-out",
            fill: "forwards"
        }).onfinish = function () {
            flash.remove();
        };
    }

    static showSkillCutIn(config, onDone) {
        const layer = this.getLayer();
        if (!layer) {
            if (typeof onDone === "function") {
                onDone();
            }
            return;
        }

        const settings = config || {};
        const banner = document.createElement("div");
        const side = settings.side === "right" ? "cutin-right" : "cutin-left";
        banner.className = "cutin-banner " + side;
        banner.style.background = "linear-gradient(90deg, " + (settings.color || "#ff8f5a") + ", rgba(8,12,22,0.92))";

        const icon = document.createElement("div");
        icon.className = "cutin-icon";
        icon.textContent = settings.icon || "技";

        const copy = document.createElement("div");
        copy.className = "cutin-copy";

        const title = document.createElement("div");
        title.className = "cutin-title";
        title.textContent = settings.skillName || "技能";

        const subtitle = document.createElement("div");
        subtitle.className = "cutin-subtitle";
        subtitle.textContent = settings.subtitle || "爆发窗口已开启";

        copy.appendChild(title);
        copy.appendChild(subtitle);
        banner.appendChild(icon);
        banner.appendChild(copy);
        layer.appendChild(banner);

        banner.animate([
            { opacity: 0, transform: "translateX(" + (side === "cutin-right" ? "40px" : "-40px") + ")" },
            { opacity: 1, transform: "translateX(0)", offset: 0.2 },
            { opacity: 1, transform: "translateX(0)", offset: 0.72 },
            { opacity: 0, transform: "translateX(" + (side === "cutin-right" ? "20px" : "-20px") + ")" }
        ], {
            duration: settings.duration || 980,
            easing: "ease-out",
            fill: "forwards"
        }).onfinish = function () {
            banner.remove();
            if (typeof onDone === "function") {
                onDone();
            }
        };
    }
}
