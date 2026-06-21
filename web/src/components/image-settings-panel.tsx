"use client";

import { type ReactNode, useState } from "react";
import { ConfigProvider, Switch } from "antd";

import { type CanvasTheme } from "@/lib/canvas-theme";
import type { AiConfig } from "@/stores/use-config-store";

const qualityOptions = [
    { value: "auto", label: "自动" },
    { value: "high", label: "高" },
    { value: "medium", label: "中" },
    { value: "low", label: "低" },
];
const DIMENSION_STEP = 16;

const GLOBAL_IMAGE_MAP: Record<string, Record<string, string>> = {
    "1:1": { "1K": "1024x1024", "2K": "2048x2048", "4K": "2880x2880" },
    "16:9": { "1K": "1280x720", "2K": "2048x1152", "4K": "3840x2160" },
    "9:16": { "1K": "720x1280", "2K": "1152x2048", "4K": "2160x3840" },
    "4:3": { "1K": "1152x864", "2K": "2304x1728", "4K": "3264x2448" },
    "3:4": { "1K": "864x1152", "2K": "1728x2304", "4K": "2448x3264" },
    "3:2": { "1K": "1536x1024", "2K": "2048x1360", "4K": "3504x2336" },
    "2:3": { "1K": "1024x1536", "2K": "1360x2048", "4K": "2336x3504" },
    "5:4": { "1K": "1120x896", "2K": "2240x1792", "4K": "3200x2560" },
    "4:5": { "1K": "896x1120", "2K": "1792x2240", "4K": "2560x3200" },
    "21:9": { "1K": "1456x624", "2K": "2912x1248", "4K": "3840x1648" },
    "9:21": { "1K": "624x1456", "2K": "1248x2912", "4K": "1648x3840" },
    "1:3": { "1K": "688x2048", "2K": "1280x3840", "4K": "1280x3840" },
    "3:1": { "1K": "2048x688", "2K": "3840x1280", "4K": "3840x1280" },
    "2:1": { "1K": "1536x768", "2K": "3072x1536", "4K": "3840x1920" },
    "1:2": { "1K": "768x1536", "2K": "1536x3072", "4K": "1920x3840" },
    "1:4": { "1K": "512x2048", "2K": "768x3072", "4K": "960x3840" },
    "4:1": { "1K": "2048x512", "2K": "3072x768", "4K": "3840x960" },
    "1:8": { "1K": "256x2048", "2K": "384x3072", "4K": "480x3840" },
    "8:1": { "1K": "2048x256", "2K": "3072x384", "4K": "3840x480" }
};

const GPT_IMAGE_2_MAP: Record<string, string> = {
    "1:1": "1024x1024",
    "16:9": "1672x941",
    "9:16": "941x1672",
    "4:3": "1443x1090",
    "3:4": "1090x1443",
    "3:2": "1536x1024",
    "2:3": "1024x1536",
    "5:4": "1408x1120",
    "4:5": "1120x1408",
    "21:9": "1920x832",
    "9:21": "832x1920",
    "1:2": "896x1792",
    "2:1": "1792x896"
};

const ALL_ASPECT_OPTIONS = [
    { value: "1:1", label: "1:1", width: 1024, height: 1024, icon: "square" },
    { value: "16:9", label: "16:9", width: 1280, height: 720, icon: "landscape" },
    { value: "9:16", label: "9:16", width: 720, height: 1280, icon: "portrait" },
    { value: "4:3", label: "4:3", width: 1152, height: 864, icon: "landscape" },
    { value: "3:4", label: "3:4", width: 864, height: 1152, icon: "portrait" },
    { value: "3:2", label: "3:2", width: 1536, height: 1024, icon: "landscape" },
    { value: "2:3", label: "2:3", width: 1024, height: 1536, icon: "portrait" },
    { value: "5:4", label: "5:4", width: 1120, height: 896, icon: "landscape" },
    { value: "4:5", label: "4:5", width: 896, height: 1120, icon: "portrait" },
    { value: "21:9", label: "21:9", width: 1456, height: 624, icon: "landscape" },
    { value: "9:21", label: "9:21", width: 624, height: 1456, icon: "portrait" },
    { value: "1:3", label: "1:3", width: 688, height: 2048, icon: "portrait" },
    { value: "3:1", label: "3:1", width: 2048, height: 688, icon: "landscape" },
    { value: "2:1", label: "2:1", width: 1536, height: 768, icon: "landscape" },
    { value: "1:2", label: "1:2", width: 768, height: 1536, icon: "portrait" },
    { value: "1:4", label: "1:4", width: 512, height: 2048, icon: "portrait" },
    { value: "4:1", label: "4:1", width: 2048, height: 512, icon: "landscape" },
    { value: "1:8", label: "1:8", width: 256, height: 2048, icon: "portrait" },
    { value: "8:1", label: "8:1", width: 2048, height: 256, icon: "landscape" },
    { value: "auto", label: "auto", width: 0, height: 0, icon: "auto" }
];

function parseImageDimensions(value: string) {
    const match = value.match(/^(\d+)x(\d+)$/i);
    if (!match) return null;
    return { width: Number(match[1]), height: Number(match[2]) };
}

function parseSizeAndTier(size: string, model: string) {
    const trimmed = size.trim();
    if (!trimmed || trimmed.toLowerCase() === "auto") {
        return { ratio: "auto", tier: "1K" as const };
    }

    let ratioStr = "1:1";
    let tier: "1K" | "2K" | "4K" = "1K";

    if (trimmed.includes("-")) {
        const parts = trimmed.split("-");
        ratioStr = parts[0] || "1:1";
        const t = parts[1] ? parts[1].toUpperCase() : "1K";
        if (t === "2K" || t === "4K") {
            tier = t as "2K" | "4K";
        }
    } else {
        const dimensions = parseImageDimensions(trimmed);
        if (dimensions) {
            const { width, height } = dimensions;
            const COMMON_RATIOS = [
                { ratio: 1.0, value: "1:1" },
                { ratio: 16/9, value: "16:9" },
                { ratio: 9/16, value: "9:16" },
                { ratio: 4/3, value: "4:3" },
                { ratio: 3/4, value: "3:4" },
                { ratio: 1.5, value: "3:2" },
                { ratio: 2/3, value: "2:3" },
                { ratio: 5/4, value: "5:4" },
                { ratio: 4/5, value: "4:5" },
                { ratio: 21/9, value: "21:9" },
                { ratio: 9/21, value: "9:21" },
                { ratio: 1/3, value: "1:3" },
                { ratio: 3/1, value: "3:1" },
                { ratio: 2/1, value: "2:1" },
                { ratio: 1/2, value: "1:2" },
                { ratio: 1/4, value: "1:4" },
                { ratio: 4/1, value: "4:1" },
                { ratio: 1/8, value: "1:8" },
                { ratio: 8/1, value: "8:1" }
            ];
            const targetRatio = width / height;
            let bestRatio = "1:1";
            let minDiff = Infinity;
            for (const item of COMMON_RATIOS) {
                const diff = Math.abs(targetRatio - item.ratio);
                if (diff < minDiff) {
                    minDiff = diff;
                    bestRatio = item.value;
                }
            }
            ratioStr = bestRatio;

            // 优先查表判断
            const normSizeStr = `${width}x${height}`;
            const mapEntry = GLOBAL_IMAGE_MAP[ratioStr];
            if (mapEntry) {
                if (mapEntry["4K"] === normSizeStr) {
                    tier = "4K";
                } else if (mapEntry["2K"] === normSizeStr) {
                    tier = "2K";
                } else if (mapEntry["1K"] === normSizeStr) {
                    tier = "1K";
                } else {
                    const pixels = width * height;
                    if (pixels >= 5500000) {
                        tier = "4K";
                    } else if (pixels >= 1800000) {
                        tier = "2K";
                    } else {
                        tier = "1K";
                    }
                }
            } else {
                const pixels = width * height;
                if (pixels >= 5500000) {
                    tier = "4K";
                } else if (pixels >= 1800000) {
                    tier = "2K";
                } else {
                    tier = "1K";
                }
            }
        } else {
            ratioStr = trimmed;
        }
    }

    return { ratio: ratioStr, tier };
}

function getModelAspectOptions(model: string) {
    const defaultRatios = ["1:1", "3:2", "2:3", "4:3", "3:4", "16:9", "9:16", "auto"];
    const gptImage2VipRatios = ["1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3", "5:4", "4:5", "21:9", "9:21", "1:3", "3:1", "2:1", "1:2", "auto"];
    const gptImage2Ratios = ["1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3", "5:4", "4:5", "21:9", "9:21", "1:2", "2:1", "auto"];
    const nanoBananaRatios = ["1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3", "5:4", "4:5", "21:9", "1:4", "4:1", "1:8", "8:1", "auto"];

    let ratios = defaultRatios;
    if (model === "gpt-image-2-vip") {
        ratios = gptImage2VipRatios;
    } else if (model === "gpt-image-2") {
        ratios = gptImage2Ratios;
    } else if (model.startsWith("nano-banana")) {
        ratios = nanoBananaRatios;
    }

    return ratios;
}

function getModelTiers(model: string) {
    if (model === "gpt-image-2") {
        return ["1K"];
    }
    return ["1K", "2K", "4K"];
}

function getResolvedSize(model: string, ratio: string, tier: "1K" | "2K" | "4K") {
    if (ratio === "auto") {
        return "auto";
    }
    if (model === "gpt-image-2") {
        return GPT_IMAGE_2_MAP[ratio] || GLOBAL_IMAGE_MAP[ratio]?.["1K"] || "1024x1024";
    }
    const ratioMap = GLOBAL_IMAGE_MAP[ratio] || GLOBAL_IMAGE_MAP["1:1"];
    return ratioMap[tier] || ratioMap["1K"] || "1024x1024";
}

type ImageSettingsPanelProps = {
    config: AiConfig;
    onConfigChange: (key: "quality" | "size" | "count", value: string) => void;
    theme: CanvasTheme;
    showTitle?: boolean;
    className?: string;
    maxCount?: number;
    quickCount?: number;
};

export function ImageSettingsPanel({ config, onConfigChange, theme, showTitle = true, className = "w-[320px] space-y-4 rounded-2xl px-1 py-0.5", maxCount = 15, quickCount = 10 }: ImageSettingsPanelProps) {
    const [snapDimensionToStep, setSnapDimensionToStep] = useState(true);
    const quality = config.quality || "auto";
    const count = Math.max(1, Math.min(maxCount, Math.floor(Math.abs(Number(config.count)) || 1)));
    
    const modelValue = config.model || config.imageModel || "";
    const actualModel = modelValue.includes("::") ? modelValue.split("::")[1] : modelValue;

    const activeSize = config.size || "auto";
    const { ratio: activeRatio, tier: activeTier } = parseSizeAndTier(activeSize, actualModel);

    const availableRatios = getModelAspectOptions(actualModel);
    const availableTiers = getModelTiers(actualModel);

    const selectedAspect = ALL_ASPECT_OPTIONS.find((item) => item.value === activeRatio) || ALL_ASPECT_OPTIONS[0];
    const dimensions = readSizeDimensions(activeSize, {
        width: selectedAspect.width || 1024,
        height: selectedAspect.height || 1024
    });

    const selectAspect = (newRatio: string) => {
        if (newRatio === "auto") {
            onConfigChange("size", "auto");
            return;
        }
        const resolvedSize = getResolvedSize(actualModel, newRatio, activeTier);
        onConfigChange("size", resolvedSize);
    };

    const selectTier = (newTier: "1K" | "2K" | "4K") => {
        if (activeRatio === "auto") return;
        const resolvedSize = getResolvedSize(actualModel, activeRatio, newTier);
        onConfigChange("size", resolvedSize);
    };

    const updateDimension = (key: "width" | "height", value: number | null) => {
        const next = Math.max(1, Math.floor(value || dimensions[key] || 1024));
        const width = key === "width" ? next : dimensions.width;
        const height = key === "height" ? next : dimensions.height;
        onConfigChange("size", `${alignDimension(width, snapDimensionToStep)}x${alignDimension(height, snapDimensionToStep)}`);
    };

    return (
        <ImageSettingsTheme theme={theme}>
            <div
                className={className}
                style={{ color: theme.node.text }}
                onMouseDown={(event) => {
                    event.stopPropagation();
                    if (event.target instanceof HTMLInputElement) return;
                    if (document.activeElement instanceof HTMLInputElement && event.currentTarget.contains(document.activeElement)) document.activeElement.blur();
                }}
            >
                {showTitle ? <div className="text-lg font-semibold">图像设置</div> : null}
                <div className="space-y-2.5">
                    <SettingTitle color={theme.node.muted}>质量</SettingTitle>
                    <div className="grid grid-cols-4 gap-2.5">
                        {qualityOptions.map((item) => (
                            <OptionPill key={item.value} selected={quality === item.value} theme={theme} onClick={() => onConfigChange("quality", item.value)}>
                                {item.label}
                            </OptionPill>
                        ))}
                    </div>
                </div>
                <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-3">
                        <SettingTitle color={theme.node.muted}>尺寸</SettingTitle>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-medium" style={{ color: theme.node.muted }}>
                                16倍数对齐
                            </span>
                            <span title="输入完成后自动向上补成 16 的倍数" onMouseDown={(event) => event.stopPropagation()}>
                                <Switch size="small" checked={snapDimensionToStep} onChange={setSnapDimensionToStep} />
                            </span>
                        </div>
                    </div>
                    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2.5">
                        <DimensionInput prefix="W" value={dimensions.width} disabled={activeSize === "auto"} theme={theme} alignToStep={snapDimensionToStep} onChange={(value) => updateDimension("width", value)} />
                        <span className="text-lg opacity-45">↔</span>
                        <DimensionInput prefix="H" value={dimensions.height} disabled={activeSize === "auto"} theme={theme} alignToStep={snapDimensionToStep} onChange={(value) => updateDimension("height", value)} />
                    </div>
                </div>
                <div className="space-y-2.5">
                    <SettingTitle color={theme.node.muted}>宽高比</SettingTitle>
                    <div className="grid grid-cols-4 gap-2.5">
                        {ALL_ASPECT_OPTIONS
                            .filter((item) => availableRatios.includes(item.value))
                            .map((item) => (
                                <button
                                    key={item.value}
                                    type="button"
                                    className="flex h-[72px] cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border bg-transparent text-sm transition hover:opacity-80"
                                    style={{ borderColor: activeRatio === item.value ? theme.node.text : theme.node.stroke, background: "transparent", color: theme.node.text }}
                                    onMouseDown={(event) => event.stopPropagation()}
                                    onClick={() => selectAspect(item.value)}
                                >
                                    <AspectIcon type={item.icon} width={item.width} height={item.height} color={theme.node.text} />
                                    <span>{item.label}</span>
                                </button>
                            ))}
                    </div>
                </div>
                <div className="space-y-2.5">
                    <SettingTitle color={theme.node.muted}>分辨率清晰度</SettingTitle>
                    <div className="grid grid-cols-3 gap-2.5">
                        {["1K", "2K", "4K"].map((tier) => {
                            const isAvailable = availableTiers.includes(tier);
                            return (
                                <button
                                    key={tier}
                                    type="button"
                                    disabled={!isAvailable || activeRatio === "auto"}
                                    className={`h-9 rounded-full border text-sm transition ${isAvailable && activeRatio !== "auto" ? "cursor-pointer hover:opacity-80" : "cursor-not-allowed opacity-35"}`}
                                    style={{
                                        background: "transparent",
                                        borderColor: activeTier === tier && activeRatio !== "auto" ? theme.node.text : theme.node.stroke,
                                        color: theme.node.text
                                    }}
                                    onMouseDown={(event) => event.stopPropagation()}
                                    onClick={() => isAvailable && selectTier(tier as "1K" | "2K" | "4K")}
                                >
                                    {tier}
                                </button>
                            );
                        })}
                    </div>
                </div>
                <div className="space-y-2.5">
                    <SettingTitle color={theme.node.muted}>生成张数</SettingTitle>
                    <div className="grid grid-cols-4 gap-2.5">
                        {Array.from({ length: quickCount }, (_, index) => index + 1).map((value) => (
                            <OptionPill key={value} selected={count === value} theme={theme} onClick={() => onConfigChange("count", String(value))}>
                                {value} 张
                            </OptionPill>
                        ))}
                        <CountInput value={count} max={maxCount} theme={theme} onChange={(value) => onConfigChange("count", String(value || 1))} />
                    </div>
                </div>
            </div>
        </ImageSettingsTheme>
    );
}

export function ImageSettingsTheme({ theme, children }: { theme: CanvasTheme; children: ReactNode }) {
    return (
        <ConfigProvider
            theme={{
                token: { colorBgContainer: theme.toolbar.panel, colorBgElevated: theme.toolbar.panel, colorBorder: theme.node.stroke, colorPrimary: theme.node.activeStroke, colorText: theme.node.text, colorTextLightSolid: theme.node.panel },
                components: { Button: { defaultBg: theme.toolbar.panel, defaultBorderColor: theme.node.stroke, defaultColor: theme.node.text } },
            }}
        >
            {children}
        </ConfigProvider>
    );
}

export function imageQualityLabel(value: string) {
    return ({ auto: "自动", high: "高", medium: "中", low: "低" } as Record<string, string>)[value] || value;
}

export function imageSizeLabel(size: string) {
    const trimmed = size.trim();
    if (!trimmed || trimmed.toLowerCase() === "auto") return "自动";
    const { ratio, tier } = parseSizeAndTier(trimmed, "gpt-image-2-vip");
    if (ratio === "auto") return "自动";
    return `${ratio}(${tier})`;
}

function OptionPill({ selected, theme, onClick, children }: { selected: boolean; theme: CanvasTheme; onClick: () => void; children: ReactNode }) {
    return (
        <button
            type="button"
            className="h-9 cursor-pointer rounded-full border px-2 text-sm transition hover:opacity-80"
            style={{ background: "transparent", borderColor: selected ? theme.node.text : theme.node.stroke, color: theme.node.text }}
            onMouseDown={(event) => event.stopPropagation()}
            onClick={onClick}
        >
            {children}
        </button>
    );
}

function DimensionInput({ prefix, value, disabled, theme, alignToStep, onChange }: { prefix: string; value: number; disabled: boolean; theme: CanvasTheme; alignToStep: boolean; onChange: (value: number | null) => void }) {
    const commit = (input: HTMLInputElement) => {
        const next = alignDimension(Math.max(1, Math.floor(Number(input.value) || value || 1024)), alignToStep);
        input.value = String(next);
        onChange(next);
    };

    return (
        <label className="flex h-9 overflow-hidden rounded-xl text-sm" style={{ background: theme.node.fill, color: theme.node.text, opacity: disabled ? 0.55 : 1 }}>
            <span className="grid w-9 place-items-center" style={{ color: theme.node.muted }}>
                {prefix}
            </span>
            <input
                type="number"
                min={1}
                disabled={disabled}
                className="min-w-0 flex-1 bg-transparent px-2 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                defaultValue={value || ""}
                key={`${prefix}-${value}`}
                onBlur={(event) => commit(event.currentTarget)}
                onKeyDown={(event) => {
                    if (event.key === "Enter") event.currentTarget.blur();
                }}
                onMouseDown={(event) => event.stopPropagation()}
            />
        </label>
    );
}

function CountInput({ value, max, theme, onChange }: { value: number; max: number; theme: CanvasTheme; onChange: (value: number | null) => void }) {
    return (
        <label className="col-span-2 flex h-9 overflow-hidden rounded-full border text-sm" style={{ borderColor: theme.node.stroke, color: theme.node.text }}>
            <input
                type="number"
                min={1}
                max={max}
                className="min-w-0 flex-1 bg-transparent px-3 text-center outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                style={{ color: theme.node.text, WebkitTextFillColor: theme.node.text }}
                value={value || ""}
                onChange={(event) => onChange(Number(event.target.value) || null)}
                onMouseDown={(event) => event.stopPropagation()}
            />
        </label>
    );
}

function AspectIcon({ type, width, height, color }: { type: string; width: number; height: number; color: string }) {
    if (type === "auto") return null;
    const ratio = width / Math.max(1, height);
    const boxWidth = ratio >= 1 ? 24 : Math.max(10, 24 * ratio);
    const boxHeight = ratio >= 1 ? Math.max(10, 24 / ratio) : 24;
    return (
        <span className="grid h-7 w-9 place-items-center">
            <span className="border-2" style={{ width: boxWidth, height: boxHeight, borderColor: color }} />
        </span>
    );
}

function SettingTitle({ children, color }: { children: string; color: string }) {
    return (
        <div className="text-xs font-medium" style={{ color }}>
            {children}
        </div>
    );
}

function readSizeDimensions(size: string, fallback: { width: number; height: number }) {
    const match = size?.match(/^(\d+)x(\d+)$/);
    return {
        width: match ? Number(match[1]) : fallback.width,
        height: match ? Number(match[2]) : fallback.height,
    };
}

function alignDimension(value: number, enabled: boolean) {
    return enabled ? Math.ceil(value / DIMENSION_STEP) * DIMENSION_STEP : value;
}
