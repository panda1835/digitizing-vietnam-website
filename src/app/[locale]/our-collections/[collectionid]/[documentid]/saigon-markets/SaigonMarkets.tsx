"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Merriweather } from "next/font/google";
import { ArrowLeft, ArrowRight, Headphones, X } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { Input } from "@/components/ui/input";
import { cn, normalizeSearchText } from "@/lib/utils";
import recordings from "./recordings.json";

const merriweather = Merriweather({ weight: "300", subsets: ["vietnamese"] });
type Recording = typeof recordings[number];
const periods = [
  {
    id: "early-morning",
    vi: "Sáng sớm",
    en: "Early morning",
    hours: "04:00–06:00",
    introVi:
      "Bắt đầu từ chợ đầu mối Bình Điền lúc 4 giờ sáng, rồi đến Bình Tây khi tiểu thương dọn hàng đầu ngày.",
    introEn:
      "Begin at Bình Điền wholesale market at 4 am, then visit Bình Tây as vendors set up their stalls.",
  },
  {
    id: "morning",
    vi: "Buổi sáng",
    en: "Morning",
    hours: "08:00–10:00",
    introVi:
      "Nghe âm thanh từ các khu quần áo, thực phẩm và ăn uống ở chợ Tân Bình và Bến Thành.",
    introEn:
      "Listen to the clothing stalls, food sections and food courts of Tân Bình and Bến Thành markets.",
  },
  {
    id: "late-afternoon",
    vi: "Chiều đến tối",
    en: "Afternoon into evening",
    hours: "16:00–18:00",
    introVi:
      "Ghé chợ Phạm Văn Hai vào buổi chiều, rồi đến khu bán hoa và ăn uống ở chợ Hồ Thị Kỷ khi trời tối dần.",
    introEn:
      "Visit Phạm Văn Hai in the afternoon, then the flowers and food stalls of Hồ Thị Kỷ as evening approaches.",
  },
];

// Pin media to the verified source revision so filenames remain stable.
const mediaBaseUrl =
  "https://raw.githubusercontent.com/lengtvan/saigon-market-soundscape/28e740f427d53c7987693ae1f4e8d7e8b32dd700/";

function mediaUrl(path: string) {
  return mediaBaseUrl + path.split("/").map(encodeURIComponent).join("/");
}

export default function SaigonMarkets({ locale }: { locale: string }) {
  const vi = locale === "vi";
  const params = useSearchParams();
  const requested = params.get("sound");
  const linked = recordings.find((item) => item.id === requested);
  const period =
    periods.find((item) => item.id === params.get("period")) ??
    periods.find((item) => item.id === linked?.period) ??
    periods[0];
  const periodRecordings = recordings.filter(
    (item) => item.period === period.id
  );
  const recording = linked?.period === period.id ? linked : periodRecordings[0];
  const [market, setMarket] = useState("");
  const [query, setQuery] = useState("");
  const [audioError, setAudioError] = useState(false);
  const [imageError, setImageError] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const detailRef = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const markets = Array.from(
    new Set(periodRecordings.map((item) => item.market))
  );
  // A market filter from another period must not hide that period's recordings.
  const activeMarket = markets.includes(market) ? market : "";
  const capitalize = (value: string) =>
    value.charAt(0).toLocaleUpperCase(locale) + value.slice(1);
  const title = (item: Recording) =>
    capitalize(vi ? item.description : item.descriptionEn);
  const results = useMemo(
    () =>
      recordings.filter(
        (item) =>
          item.period === period.id &&
          (!activeMarket || item.market === activeMarket) &&
          normalizeSearchText(
            [
              item.market,
              item.sourceMarket,
              item.description,
              item.descriptionEn,
              item.recorded,
              `${item.hour}:00`,
            ].join(" ")
          ).includes(normalizeSearchText(query))
      ),
    [period.id, activeMarket, query]
  );
  const index = results.findIndex((item) => item.id === recording.id);

  useEffect(() => {
    setAudioError(false);
    setImageError(false);
    const menu = menuRef.current;
    const selected = menu?.querySelector<HTMLElement>('[aria-current="true"]');
    if (menu && selected) menu.scrollTop = selected.offsetTop - menu.offsetTop;
  }, [recording.id]);

  function navigate(item: Recording, focusDetail = false) {
    audioRef.current?.pause();
    const url = new URL(window.location.href);
    url.searchParams.set("period", item.period);
    url.searchParams.set("sound", item.id);
    window.history.pushState(null, "", url.toString());
    if (focusDetail)
      window.requestAnimationFrame(() => {
        detailRef.current?.scrollIntoView({
          block: "start",
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
            .matches
            ? "auto"
            : "smooth",
        });
        detailRef.current?.focus({ preventScroll: true });
      });
  }

  function changePeriod(id: string) {
    setMarket("");
    setQuery("");
    navigate(recordings.find((item) => item.period === id)!);
  }

  const buttonClass =
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-sm hover:border-branding-brown hover:text-[#8b5e18] focus-visible:outline focus-visible:outline-2 focus-visible:outline-branding-brown disabled:cursor-not-allowed disabled:opacity-40";
  return (
    <div className="mt-10 font-['Helvetica_Neue',sans-serif] text-branding-black">
      <h2 className={`${merriweather.className} text-2xl font-normal`}>
        {vi
          ? "Theo nhịp chợ Sài Gòn"
          : "Follow the rhythms of Saigon’s markets"}
      </h2>
      <p className="mt-3 max-w-7xl text-base leading-relaxed text-gray-700">
        {vi
          ? "Khám phá 33 bản ghi tại 6 khu chợ, từ 4 giờ sáng đến 6 giờ tối. Chọn một khung giờ để bắt đầu nghe."
          : "Explore 33 recordings across six markets, from 4 am to 6 pm. Choose a time of day to start listening."}
      </p>
      <nav
        aria-label={vi ? "Khung giờ ghi âm" : "Recording time of day"}
        className="mt-6 grid scroll-mt-6 grid-cols-1 gap-2 focus:outline-none sm:grid-cols-3"
      >
        {periods.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => changePeriod(item.id)}
            aria-pressed={period.id === item.id}
            className={cn(
              "rounded-lg border px-4 py-4 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-branding-brown",
              period.id === item.id
                ? "border-branding-brown bg-[#8b5e18] text-white"
                : "border-gray-300 bg-white hover:border-branding-brown"
            )}
          >
            <span className="block text-sm tabular-nums">{item.hours}</span>
            <span className="mt-1 block text-lg">{vi ? item.vi : item.en}</span>
            <span className="mt-2 block text-sm">
              {recordings.filter((r) => r.period === item.id).length}{" "}
              {vi ? "bản ghi" : "recordings"}
            </span>
          </button>
        ))}
      </nav>
      <p className="mb-8 mt-5 max-w-7xl leading-relaxed text-gray-700">
        {vi ? period.introVi : period.introEn}
      </p>
      <div className="flex flex-col gap-8 lg:flex-row">
        <aside
          aria-label={vi ? "Danh sách bản ghi" : "Recordings"}
          className="w-full min-w-0 shrink-0 lg:w-1/3"
        >
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <h3 className="bg-[#8b5e18] p-4 text-xl font-normal text-white">
              {vi ? period.vi : period.en}
            </h3>
            <div className="space-y-3 p-4">
              <label htmlFor="market-search" className="sr-only">
                {vi ? "Tìm bản ghi trong khung giờ" : "Search this time of day"}
              </label>
              <Input
                id="market-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={
                  vi
                    ? "Âm thanh, địa điểm, tháng/năm…"
                    : "Sound, location, month/year…"
                }
              />
              <nav
                aria-label={vi ? "Chợ" : "Market"}
                className="grid grid-cols-2 gap-2"
              >
                {markets.map((name) => {
                  const items = periodRecordings.filter(
                    (item) => item.market === name
                  );
                  const hours = Array.from(
                    new Set(items.map((item) => item.hour))
                  );
                  const time = (hour: number) =>
                    `${String(hour).padStart(2, "0")}:00`;
                  const timeFrame =
                    hours.length > 1
                      ? `${time(hours[0])}–${time(hours[hours.length - 1])}`
                      : time(hours[0]);
                  return (
                    <button
                      key={name}
                      type="button"
                      aria-pressed={activeMarket === name}
                      onClick={() => {
                        const nextMarket = activeMarket === name ? "" : name;
                        setMarket(nextMarket);
                        if (nextMarket) navigate(items[0]);
                      }}
                      className={cn(
                        "rounded-lg border px-4 py-4 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-branding-brown",
                        activeMarket === name
                          ? "border-branding-brown bg-[#8b5e18] text-white"
                          : "border-gray-300 bg-white hover:border-branding-brown"
                      )}
                    >
                      <span className="block text-base">
                        {capitalize(name)}
                      </span>
                      <span className="mt-1 block text-sm tabular-nums">
                        {timeFrame}
                      </span>
                    </button>
                  );
                })}
              </nav>
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <p role="status">
                  {results.length} / {periodRecordings.length}{" "}
                  {vi ? "bản ghi" : "recordings"}
                </p>
                {(query || activeMarket) && (
                  <button
                    type="button"
                    className="min-h-11 underline underline-offset-4 hover:text-[#8b5e18]"
                    onClick={() => {
                      setQuery("");
                      setMarket("");
                    }}
                  >
                    {vi ? "Xóa bộ lọc" : "Clear filters"}
                  </button>
                )}
              </div>
            </div>
            <div
              ref={menuRef}
              tabIndex={0}
              aria-label={vi ? "Kết quả bản ghi" : "Recording results"}
              className="relative max-h-72 overflow-y-auto focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-branding-brown lg:max-h-[600px]"
            >
              {results.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() =>
                    navigate(
                      item,
                      window.matchMedia("(max-width: 1023px)").matches
                    )
                  }
                  aria-current={recording.id === item.id ? "true" : undefined}
                  className={cn(
                    "block w-full px-5 py-4 text-left hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-branding-brown",
                    recording.id === item.id &&
                      "bg-branding-brown/10 hover:bg-branding-brown/10"
                  )}
                >
                  <span className="block text-sm text-gray-600">
                    <span className="tabular-nums">
                      {String(item.hour).padStart(2, "0")}:00
                    </span>{" "}
                    · {item.market}
                  </span>
                  <span className="mt-1 block text-base">{title(item)}</span>
                </button>
              ))}
              {!results.length && (
                <p className="p-5 leading-relaxed text-gray-700">
                  {vi
                    ? "Không tìm thấy bản ghi phù hợp. Thử từ khóa khác hoặc xóa bộ lọc."
                    : "No recordings match. Try another search or clear the filters."}
                </p>
              )}
            </div>
          </div>
        </aside>
        <article
          ref={detailRef}
          tabIndex={-1}
          aria-labelledby="market-recording-title"
          className="w-full min-w-0 scroll-mt-6 focus:outline-none"
        >
          {requested && !linked && (
            <p role="status" className="mb-4 text-sm text-gray-700">
              {vi
                ? "Không tìm thấy bản ghi trong liên kết. Đang hiển thị bản ghi đầu tiên trong khung giờ."
                : "The linked recording was not found. Showing the first recording in this time of day."}
            </p>
          )}
          <h3
            id="market-recording-title"
            className={`${merriweather.className} text-3xl font-normal leading-tight`}
          >
            {title(recording)}
          </h3>
          {!vi && (
            <p lang="vi" className="mt-2 text-lg text-gray-700">
              {capitalize(recording.description)}
            </p>
          )}
          <p className="mt-3 text-base text-gray-700">
            {recording.market} ·{" "}
            <span className="tabular-nums">
              {String(recording.hour).padStart(2, "0")}:00
            </span>
          </p>
          <div className="my-6 py-5">
            <h4 className="mb-3 flex items-center gap-2 text-base font-medium">
              <Headphones size={18} aria-hidden="true" />
              {vi ? "Nghe bản ghi" : "Listen to the recording"}
            </h4>
            <audio
              key={recording.id}
              ref={audioRef}
              controls
              preload="none"
              src={mediaUrl(recording.audio)}
              onError={() => setAudioError(true)}
              className="w-full"
              aria-label={`${recording.market}: ${title(recording)}`}
            />
            {audioError && (
              <div role="alert" className="mt-3 text-sm text-gray-700">
                <p>
                  {vi
                    ? "Không tải được âm thanh. Vui lòng thử lại."
                    : "The audio could not load. Please try again."}
                </p>
                <button
                  type="button"
                  className="mt-2 min-h-11 underline underline-offset-4"
                  onClick={() => {
                    setAudioError(false);
                    audioRef.current?.load();
                  }}
                >
                  {vi ? "Tải lại âm thanh" : "Retry audio"}
                </button>
              </div>
            )}
          </div>
          {imageError ? (
            <p role="status" className="py-8 text-gray-600">
              {vi
                ? "Không tải được ảnh của bản ghi này."
                : "The photograph for this recording could not load."}
            </p>
          ) : (
            <Dialog.Root key={recording.id}>
              <Dialog.Trigger asChild>
                <button
                  type="button"
                  className="block w-full cursor-zoom-in rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-branding-brown"
                  aria-label={vi ? "Mở ảnh đầy đủ" : "Open full photograph"}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={mediaUrl(recording.image)}
                    alt={`${recording.market}: ${recording.description}`}
                    onError={() => setImageError(true)}
                    className="h-auto w-full rounded"
                  />
                </button>
              </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-50 bg-black/75" />
                <Dialog.Content
                  aria-describedby={undefined}
                  className="fixed left-1/2 top-1/2 z-50 w-max max-w-[90vw] -translate-x-1/2 -translate-y-1/2 outline-none"
                >
                  <Dialog.Title className="sr-only">
                    {recording.market}: {title(recording)}
                  </Dialog.Title>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={mediaUrl(recording.image)}
                    alt={`${recording.market}: ${recording.description}`}
                    className="max-h-[90dvh] max-w-[90vw] object-contain"
                  />
                  <Dialog.Close
                    aria-label={vi ? "Đóng ảnh" : "Close image"}
                    className="absolute right-2 top-2 rounded bg-white p-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-branding-brown"
                  >
                    <X size={20} aria-hidden="true" />
                  </Dialog.Close>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          )}
          <dl className="mt-6 grid grid-cols-1 gap-5 text-sm sm:grid-cols-2">
            {[
              [vi ? "Chợ" : "Market", recording.sourceMarket],
              [
                vi ? "Tháng/năm ghi âm" : "Recording month/year",
                recording.recorded,
              ],
              [
                vi ? "Giờ ghi âm" : "Recording time",
                `${String(recording.hour).padStart(2, "0")}:00`,
              ],
              [vi ? "Khung giờ" : "Time of day", vi ? period.vi : period.en],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-gray-600">{label}</dt>
                <dd className="mt-1 text-base font-light">{value}</dd>
              </div>
            ))}
          </dl>
          <nav
            aria-label={vi ? "Chuyển bản ghi" : "Recording navigation"}
            className="mt-8 flex flex-wrap justify-between gap-3 pt-5"
          >
            <button
              type="button"
              className={buttonClass}
              disabled={index <= 0}
              onClick={() => navigate(results[index - 1], true)}
            >
              <ArrowLeft size={16} aria-hidden="true" />
              {vi ? "Bản ghi trước" : "Previous recording"}
            </button>
            <button
              type="button"
              className={buttonClass}
              disabled={!results.length || index === results.length - 1}
              onClick={() => navigate(results[index + 1], true)}
            >
              {vi ? "Bản ghi tiếp" : "Next recording"}
              <ArrowRight size={16} aria-hidden="true" />
            </button>
          </nav>
        </article>
      </div>
    </div>
  );
}
