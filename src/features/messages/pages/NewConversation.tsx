import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router";
import { ServerErrorAlert } from "../../../components/ui/Alert";
import { Button } from "../../../components/ui/Button";
import { Spinner } from "../../../components/ui/Spinner";
import { TextField } from "../../../components/ui/TextField";
import { useAccess } from "../../access/access-context";
import { getApiErrorMessage, type ParsedApiError } from "../../../services/api-error";
import { fetchMessageRecipients, messageInvalidationKey, messageRecipientKey, sendMessage } from "../api";
import { personLabel } from "../normalize";
import { toMessageDraft } from "../schemas";
import type { MessageFormValues } from "../schemas";
import { MessageComposer } from "./MessageComposer";

export function NewConversation({ onClose }: { onClose: () => void }) {
  const access = useAccess();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const persona = access.context?.persona;
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");
  const [receiverId, setReceiverId] = useState("");
  const [serverError, setServerError] = useState<ParsedApiError | null>(null);
  const enabled = persona === "admin" ? search.length >= 2 : true;
  const recipientsQuery = useQuery({
    queryKey: messageRecipientKey(search),
    queryFn: () => fetchMessageRecipients(search),
    enabled,
  });
  const selected = recipientsQuery.data?.recipients.find((recipient) => recipient.id === receiverId);
  const mutation = useMutation({
    mutationFn: (values: MessageFormValues) => sendMessage(toMessageDraft(receiverId, values)),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: messageInvalidationKey });
      navigate(`/app/messages/${result.message.receiver.id}`);
      onClose();
    },
    onError: (error) => setServerError(getApiErrorMessage(error)),
  });

  return (
    <div className="grid gap-4 rounded-xl border border-line bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-lg font-medium text-ink">New conversation</h2>
        <Button type="button" variant="ghost" onClick={onClose}>
          Close
        </Button>
      </div>
      {serverError ? <ServerErrorAlert error={serverError} /> : null}
      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          setSearch(draft.trim());
        }}
      >
        <div className="min-w-60 flex-1">
          <TextField
            label="Find a recipient"
            name="recipientSearch"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            hint={persona === "admin" ? "Search by name, username, or email. At least 2 characters." : "Filter by name or school ID."}
          />
        </div>
        <Button type="submit" variant="secondary">
          Find
        </Button>
      </form>
      {recipientsQuery.isFetching ? <Spinner label="Finding recipients" /> : null}
      {recipientsQuery.error ? <ServerErrorAlert error={getApiErrorMessage(recipientsQuery.error)} /> : null}
      {enabled && recipientsQuery.data && recipientsQuery.data.recipients.length === 0 ? (
        <p className="text-sm text-slate-600">No eligible recipients match this search.</p>
      ) : null}
      {recipientsQuery.data && recipientsQuery.data.recipients.length > 0 ? (
        <ul className="grid max-h-60 gap-2 overflow-auto">
          {recipientsQuery.data.recipients.map((recipient) => (
            <li key={recipient.id}>
              <button
                type="button"
                aria-pressed={recipient.id === receiverId}
                className="w-full rounded-lg border border-line px-3 py-3 text-left text-sm focus-visible:ring-2 focus-visible:ring-pine focus-visible:outline-none"
                onClick={() => setReceiverId(recipient.id)}
              >
                <span className="font-medium text-ink">{personLabel(recipient)}</span>
                {recipient.detail ? <span className="mt-1 block text-slate-600">{recipient.detail}</span> : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {selected ? <p className="text-sm text-slate-700">Selected: {personLabel(selected)}</p> : null}
      {receiverId ? (
        <MessageComposer
          busy={mutation.isPending}
          onSend={async (values) => {
            await mutation.mutateAsync(values);
          }}
        />
      ) : (
        <p className="text-sm text-slate-600">Choose a recipient before writing the message.</p>
      )}
    </div>
  );
}
