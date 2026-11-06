"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Headphones, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn, normalizeSearchText } from "@/lib/utils";
import recordings from "./recordings.json";

type Recording = typeof recordings[number];
const groups: Record<string, string> = {
  "Đồ ăn": "Food",
  "Hàng hóa": "Goods",
  "Dịch vụ": "Services",
  "Ve chai, phế liệu": "Scrap & recycling",
};
const regions: Record<string, string> = {
  Bắc: "Northern Vietnam",
  Trung: "Central Vietnam",
  Nam: "Southern Vietnam",
  "Tây Nguyên": "Central Highlands",
};

export default function StreetCries({ locale }: { locale: string }) {
  const vi = locale === "vi";
  const searchParams = useSearchParams();
  const requested = searchParams.get("sound");
  const recording =
    recordings.find((item) => item.id === requested) ?? recordings[0];
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("");
  const [group, setGroup] = useState("");
  const [audioError, setAudioError] = useState(false);
  const detailRef = useRef<HTMLElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const title = (item: Recording) => (vi ? item.vi : item.en);
  const groupLabel = (value: string) =>
    value
      ? vi
        ? value
        : groups[value] ?? value
      : vi
      ? "Chưa xác định"
      : "Unspecified";
  const regionLabel = (value: string) => (vi ? value : regions[value] ?? value);
  const results = useMemo(
    () =>
      recordings.filter(
        (item) =>
          (!region || item.region === region) &&
          (!group ||
            (group === "unspecified" ? !item.group : item.group === group)) &&
          normalizeSearchText(
            [
              item.vi,
              item.en,
              item.call,
              item.callEn,
              item.province,
              item.place,
              item.year,
            ].join(" ")
          ).includes(normalizeSearchText(query))
      ),
    [query, region, group]
  );
  const index = recordings.findIndex((item) => item.id === recording.id);

  useEffect(() => {
    setAudioError(false);
    // Switching recordings never autoplays; the previous audio is unmounted.
  }, [recording.id]);

  function select(item: Recording) {
    audioRef.current?.pause();
    const url = new URL(window.location.href);
    url.searchParams.set("sound", item.id);
    window.history.pushState(null, "", url.toString());
    if (window.matchMedia("(max-width: 1023px)").matches) {
      detailRef.current?.scrollIntoView({ block: "start" });
      detailRef.current?.focus({ preventScroll: true });
    }
  }

  const controlClass =
    "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-branding-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-branding-brown";
  return (
    <div className="mt-10 font-['Helvetica_Neue',sans-serif] text-branding-black">
      <div className="flex flex-col gap-8 lg:flex-row">
        <aside
          className="w-full min-w-0 shrink-0 lg:w-96"
          aria-label={vi ? "Danh sách bản ghi" : "Recordings"}
        >
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <div className="bg-branding-brown p-4 text-center text-white">
              <h2 className="text-xl font-normal uppercase">
                {vi ? "Danh sách tiếng rao" : "Street cries"}
              </h2>
            </div>
            <div className="space-y-3 border-b border-gray-200 p-4">
              <label htmlFor="street-cry-search" className="block text-sm">
                {vi ? "Tìm bản ghi" : "Find a recording"}
              </label>
              <Input
                id="street-cry-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={
                  vi
                    ? "Tên, lời rao, địa điểm, năm…"
                    : "Name, transcript, place, year…"
                }
              />
              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-1 text-sm">
                  {" "}
                  <span>{vi ? "Vùng" : "Region"}</span>
                  <select
                    className={controlClass}
                    value={region}
                    onChange={(event) => setRegion(event.target.value)}
                  >
                    <option value="">
                      {vi ? "Tất cả vùng" : "All regions"}
                    </option>
                    {Object.keys(regions).map((value) => (
                      <option key={value} value={value}>
                        {regionLabel(value)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1 text-sm">
                  <span>{vi ? "Nhóm hàng" : "Category"}</span>
                  <select
                    className={controlClass}
                    value={group}
                    onChange={(event) => setGroup(event.target.value)}
                  >
                    <option value="">
                      {vi ? "Tất cả nhóm" : "All categories"}
                    </option>
                    {Object.keys(groups).map((value) => (
                      <option key={value} value={value}>
                        {groupLabel(value)}
                      </option>
                    ))}
                    <option value="unspecified">
                      {vi ? "Chưa xác định" : "Unspecified"}
                    </option>
                  </select>
                </label>
              </div>
              <div className="flex items-center justify-between gap-2 text-sm">
                <p role="status">
                  {results.length} / {recordings.length}{" "}
                  {vi ? "bản ghi" : "recordings"}
                </p>
                {(query || region || group) && (
                  <button
                    className="underline underline-offset-4 hover:text-branding-brown"
                    onClick={() => {
                      setQuery("");
                      setRegion("");
                      setGroup("");
                    }}
                  >
                    {vi ? "Xóa bộ lọc" : "Clear filters"}
                  </button>
                )}
              </div>
            </div>
            <div
              className="max-h-72 overflow-y-auto lg:max-h-[600px]"
              tabIndex={0}
              aria-label={vi ? "Kết quả bản ghi" : "Recording results"}
            >
              {results.map((item) => (
                <button
                  key={item.id}
                  onClick={() => select(item)}
                  aria-current={item.id === recording.id ? "true" : undefined}
                  className={cn(
                    "block w-full border-b border-gray-100 px-5 py-4 text-left transition-colors hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-branding-brown",
                    item.id === recording.id &&
                      "bg-branding-brown/10 hover:bg-branding-brown/10"
                  )}
                >
                  <span className="block text-base font-normal">
                    {title(item)}
                  </span>
                  <span className="mt-1 block text-sm text-gray-600">
                    {item.place || item.province} · {item.year}
                  </span>
                </button>
              ))}
              {!results.length && (
                <div className="space-y-2 p-5 text-gray-700">
                  <p>
                    {vi
                      ? "Không tìm thấy bản ghi phù hợp."
                      : "No recordings match your search."}
                  </p>
                  <p className="text-sm">
                    {vi
                      ? "Thử từ khóa khác hoặc xóa bộ lọc."
                      : "Try another search or clear the filters."}
                  </p>
                </div>
              )}
            </div>
          </div>
        </aside>
        <article
          ref={detailRef}
          tabIndex={-1}
          aria-labelledby="street-cry-title"
          className="min-w-0 w-full scroll-mt-6 focus:outline-none"
        >
          {requested && requested !== recording.id && (
            <p role="status" className="mb-4 text-sm text-gray-700">
              {vi
                ? "Không tìm thấy bản ghi trong liên kết. Đang hiển thị bản ghi đầu tiên."
                : "The linked recording was not found. Showing the first recording."}
            </p>
          )}
          <h2
            id="street-cry-title"
            className="font-garamond text-3xl leading-tight"
          >
            {title(recording)}
          </h2>
          {!vi && (
            <p lang="vi" className="mt-2 text-lg text-gray-700">
              {recording.vi}
            </p>
          )}
          <p className="mt-3 text-sm text-gray-600">
            {[recording.place, recording.province, recording.year]
              .filter(Boolean)
              .join(" · ")}
          </p>
          <div className="my-6 py-5">
            <h3 className="mb-3 flex items-center gap-2 text-base font-medium">
              <Headphones size={18} aria-hidden="true" />
              {vi ? "Nghe bản ghi" : "Listen to the recording"}
            </h3>
            <audio
              key={recording.id}
              ref={audioRef}
              controls
              preload="none"
              src={recording.audio}
              onError={() => setAudioError(true)}
              className="w-full"
              aria-label={`${vi ? "Nghe" : "Listen to"} ${title(recording)}`}
            />
            {audioError && (
              <p role="alert" className="mt-3 text-sm text-gray-700">
                {vi
                  ? "Không tải được âm thanh. Vui lòng tải lại trang để thử lại."
                  : "The audio could not load. Please reload the page to try again."}
              </p>
            )}
          </div>
          <div
            className={cn(
              "gap-6",
              recording.image &&
                "flex flex-col sm:grid sm:grid-cols-2"
            )}
          >
            <div>
              <h3 className="text-lg font-medium">
                {vi ? "Lời rao" : "Vendor’s call"}
              </h3>
              {recording.call ? (
                <blockquote
                  lang="vi"
                  className="mt-3 max-w-prose whitespace-pre-line text-lg font-light leading-relaxed"
                >
                  “{recording.call}”
                </blockquote>
              ) : (
                <p className="mt-3 text-gray-600">
                  {vi
                    ? "Chưa có lời rao trong dữ liệu."
                    : "No transcript is provided in the metadata."}
                </p>
              )}
              {!vi && recording.callEn && (
                <div className="mt-5">
                  <h4 className="text-lg font-medium">English translation</h4>
                  <p className="mt-3 max-w-prose whitespace-pre-line text-lg font-light leading-relaxed">
                    {recording.callEn}
                  </p>
                </div>
              )}
            </div>
            {recording.image && (
              <Dialog key={recording.id}>
                <DialogTrigger asChild>
                  <button
                    type="button"
                    className="order-first block w-full self-start cursor-zoom-in rounded sm:order-none sm:w-auto focus-visible:outline focus-visible:outline-2 focus-visible:outline-branding-brown"
                    aria-label={vi ? "Mở ảnh đầy đủ" : "Open full photograph"}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={recording.image}
                      alt={recording.vi}
                      className="h-auto w-full rounded object-contain"
                    />
                  </button>
                </DialogTrigger>
                <DialogPrimitive.Portal>
                  <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/75" />
                  <DialogPrimitive.Content
                    aria-describedby={undefined}
                    className="fixed left-1/2 top-1/2 z-50 w-max max-w-[90vw] -translate-x-1/2 -translate-y-1/2 bg-transparent outline-none"
                  >
                    <DialogTitle className="sr-only">
                      {title(recording)}
                    </DialogTitle>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={recording.image}
                      alt={recording.vi}
                      className="block h-auto max-h-[90dvh] w-auto max-w-[90vw]"
                    />
                    <DialogPrimitive.Close
                      className="absolute right-2 top-2 rounded bg-white/90 p-2 text-branding-black hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-branding-brown"
                      aria-label={vi ? "Đóng ảnh" : "Close image"}
                    >
                      <X size={20} aria-hidden="true" />
                    </DialogPrimitive.Close>
                  </DialogPrimitive.Content>
                </DialogPrimitive.Portal>
              </Dialog>
            )}
          </div>
          <dl className="mt-8 grid grid-cols-1 gap-x-6 gap-y-5 pt-6 text-sm sm:grid-cols-2">
            {[
              [vi ? "Vùng" : "Region", regionLabel(recording.region)],
              [vi ? "Tỉnh / Thành phố" : "Province / City", recording.province],
              [vi ? "Địa điểm" : "Location", recording.place],
              [vi ? "Năm ghi âm" : "Recording year", recording.year],
              [vi ? "Nhóm hàng" : "Category", groupLabel(recording.group)],
              [
                vi ? "Hình thức âm thanh" : "Sound delivery",
                vi
                  ? recording.delivery
                  : recording.deliveryEn || recording.delivery,
              ],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-gray-600">{label}</dt>
                <dd className="mt-1 text-base font-light">
                  {value || (vi ? "Chưa có thông tin" : "Not specified")}
                </dd>
              </div>
            ))}
          </dl>
          <nav
            aria-label={vi ? "Chuyển bản ghi" : "Recording navigation"}
            className="mt-8 flex justify-between gap-5 pt-5"
          >
            <button
              disabled={index === 0}
              onClick={() => select(recordings[index - 1])}
              className="flex items-center gap-2 text-sm hover:text-branding-brown disabled:opacity-40"
            >
              <ArrowLeft size={16} aria-hidden="true" />
              {vi ? "Bản ghi trước" : "Previous recording"}
            </button>
            <button
              disabled={index === recordings.length - 1}
              onClick={() => select(recordings[index + 1])}
              className="flex items-center gap-2 text-sm hover:text-branding-brown disabled:opacity-40"
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
