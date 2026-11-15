"use client";

import { FormEvent, useId, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function EventSubmissionForm({ locale }: { locale: string }) {
  const vi = locale === "vi";
  const uid = useId();
  const [status, setStatus] = useState<
    "idle" | "sending" | "success" | "error"
  >("idle");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    setStatus("sending");
    try {
      const response = await fetch("/api/event-submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(data)),
      });
      if (!response.ok) throw new Error();
      form.reset();
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  const fields = [
    { name: "name", type: "text", en: "Your name", vi: "Tên của bạn" },
    { name: "email", type: "email", en: "Email address", vi: "Địa chỉ email" },
    { name: "eventName", type: "text", en: "Event name", vi: "Tên sự kiện" },
    {
      name: "url",
      type: "url",
      en: "Event information URL",
      vi: "Link sự kiện",
    },
  ];

  return (
    <section className="rounded-md border border-[#dedede] p-5 text-branding-black">
      <h3 className="text-xl">
        {vi
          ? "Hãy cho chúng tôi biết về sự kiện của bạn"
          : "Tell us about your event"}
      </h3>
      <p className="mt-2 mb-4 text-sm">
        {vi
          ? "Bạn có sự kiện muốn chia sẻ? Hãy gửi cho chúng tôi, chúng tôi sẽ cân nhắc đăng lên lịch."
          : "Know of an event we should feature? Send it our way and we'll take a look."}
      </p>
      <form onSubmit={onSubmit} className="space-y-3">
        <label className="mb-1 text-sm hidden">
          {vi ? "Diễn giả" : "Speakers"}
        </label>
        <input
          type="text"
          name="speaker_list"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="hidden"
        />
        {fields.map((f) => (
          <div key={f.name}>
            <label htmlFor={`${uid}-${f.name}`} className="mb-1 block text-sm">
              {vi ? f.vi : f.en}
            </label>
            <Input
              id={`${uid}-${f.name}`}
              name={f.name}
              type={f.type}
              required
              maxLength={f.name === "eventName" ? 300 : 200}
            />
          </div>
        ))}
        <div>
          <label htmlFor={`${uid}-description`} className="mb-1 block text-sm">
            {vi ? "Mô tả ngắn gọn về sự kiện" : "Brief description"}
          </label>
          <Textarea
            id={`${uid}-description`}
            name="description"
            required
            rows={4}
            maxLength={2000}
          />
        </div>
        <button
          type="submit"
          disabled={status === "sending"}
          className="rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-60"
        >
          {status === "sending"
            ? vi
              ? "Đang gửi…"
              : "Sending…"
            : vi
            ? "Gửi sự kiện"
            : "Submit event"}
        </button>
        <p role="status" className="text-sm">
          {status === "success" &&
            (vi
              ? "Cảm ơn bạn! Chúng tôi đã nhận được thông tin."
              : "Thank you! We've received your event.")}
          {status === "error" &&
            (vi
              ? "Không thể gửi. Vui lòng thử lại sau."
              : "Something went wrong. Please try again later.")}
        </p>
      </form>
    </section>
  );
}
