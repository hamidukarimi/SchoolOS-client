import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "../../../components/ui/Button";
import { TextField } from "../../../components/ui/TextField";
import { messageFormSchema, type MessageFormValues } from "../schemas";

export function MessageComposer({
  busy,
  onSend,
}: {
  busy: boolean;
  onSend: (values: MessageFormValues) => Promise<void>;
}) {
  const form = useForm<MessageFormValues>({
    resolver: zodResolver(messageFormSchema),
    defaultValues: { subject: "", content: "" },
  });
  const { errors } = form.formState;

  return (
    <form
      className="grid gap-3 rounded-xl border border-line bg-white p-4"
      onSubmit={form.handleSubmit(async (values) => {
        if (busy) return;
        await onSend(values);
        form.reset({ subject: "", content: "" });
      })}
      noValidate
    >
      <TextField label="Subject" error={errors.subject?.message} {...form.register("subject")} />
      <div className="grid gap-1.5">
        <label htmlFor="message-content" className="text-sm font-medium text-ink">
          Message
        </label>
        <textarea
          id="message-content"
          rows={4}
          aria-invalid={errors.content ? true : undefined}
          aria-describedby={errors.content ? "message-content-error" : undefined}
          className={`rounded-lg border bg-white px-3 py-2.5 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-pine ${
            errors.content ? "border-rose-600" : "border-line"
          }`}
          {...form.register("content")}
        />
        {errors.content ? (
          <p id="message-content-error" className="text-sm text-rose-700">
            {errors.content.message}
          </p>
        ) : null}
      </div>
      <div className="flex justify-end">
        <Button type="submit" busy={busy} disabled={busy}>
          {busy ? "Sending" : "Send message"}
        </Button>
      </div>
    </form>
  );
}
