import { useState, type FormEvent, type ReactNode } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  adminUpdateUser,
  reviewerUpdateUser,
  type AdminUpdateUserRequest,
} from "@workspace/api-client-react";

export type EditableUserRole = "admin" | "reviewer" | "volunteer" | "vulnerable";

export interface EditableRow {
  id: number;
  name: string;
  email: string;
  skills?: string | null;
  address?: string;
  nokName?: string;
  nokRelation?: string;
  nokContact?: string;
}

interface Props {
  scope: "admin" | "reviewer";
  role: EditableUserRole;
  row: EditableRow;
  invalidateKey: readonly unknown[];
  onClose: () => void;
  onSaved: () => void;
}

export function UserEditModal({
  scope,
  role,
  row,
  invalidateKey,
  onClose,
  onSaved,
}: Props) {
  const qc = useQueryClient();
  const [name, setName] = useState(row.name);
  const [email, setEmail] = useState(row.email);
  const [password, setPassword] = useState("");
  const [skills, setSkills] = useState(role === "volunteer" ? row.skills ?? "" : "");
  const [address, setAddress] = useState(role === "vulnerable" ? row.address ?? "" : "");
  const [nokName, setNokName] = useState(role === "vulnerable" ? row.nokName ?? "" : "");
  const [nokRelation, setNokRelation] = useState(
    role === "vulnerable" ? row.nokRelation ?? "" : "",
  );
  const [nokContact, setNokContact] = useState(
    role === "vulnerable" ? row.nokContact ?? "" : "",
  );
  const [error, setError] = useState<string | null>(null);

  const update = useMutation({
    mutationFn: (body: AdminUpdateUserRequest) => {
      const fn = scope === "admin" ? adminUpdateUser : reviewerUpdateUser;
      return fn(role, row.id, body, { credentials: "include" });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: invalidateKey });
      onSaved();
    },
    onError: (err) =>
      setError(
        (err as { data?: { message?: string } })?.data?.message ??
          "Could not update user.",
      ),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const body: AdminUpdateUserRequest = {};
    if (name.trim() !== row.name) body.name = name.trim();
    if (email.trim().toLowerCase() !== row.email) body.email = email.trim().toLowerCase();
    if (password.length > 0) body.password = password;
    if (role === "volunteer") {
      const orig = row.skills ?? "";
      if (skills !== orig) body.skills = skills.trim() || null;
    }
    if (role === "vulnerable") {
      if (address.trim() !== (row.address ?? "")) body.address = address.trim();
      if (nokName.trim() !== (row.nokName ?? "")) body.nokName = nokName.trim();
      if (nokRelation.trim() !== (row.nokRelation ?? ""))
        body.nokRelation = nokRelation.trim();
      if (nokContact.trim() !== (row.nokContact ?? ""))
        body.nokContact = nokContact.trim();
    }
    if (Object.keys(body).length === 0) {
      setError("No changes to save.");
      return;
    }
    update.mutate(body);
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <form
        onSubmit={onSubmit}
        className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto"
      >
        <div>
          <h3 className="font-serif text-xl font-bold text-stone-900">
            Edit {role} account
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">
            ID #{row.id} · Leave password blank to keep current.
          </p>
        </div>

        <Field label="Full name">
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-stone-200 px-3 py-2 focus:outline-none focus:border-[hsl(var(--primary))]"
          />
        </Field>
        <Field label="Email">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-stone-200 px-3 py-2 font-mono focus:outline-none focus:border-[hsl(var(--primary))]"
          />
        </Field>
        <Field label="New password (optional)">
          <input
            type="password"
            autoComplete="new-password"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Leave blank to keep existing"
            className="w-full rounded-lg border border-stone-200 px-3 py-2 font-mono focus:outline-none focus:border-[hsl(var(--primary))]"
          />
        </Field>

        {role === "volunteer" && (
          <Field label="Skills">
            <input
              type="text"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="e.g. CPR, First Aid"
              className="w-full rounded-lg border border-stone-200 px-3 py-2 focus:outline-none focus:border-[hsl(var(--primary))]"
            />
          </Field>
        )}

        {role === "vulnerable" && (
          <>
            <Field label="Address">
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full rounded-lg border border-stone-200 px-3 py-2 focus:outline-none focus:border-[hsl(var(--primary))]"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Next-of-kin name">
                <input
                  type="text"
                  required
                  value={nokName}
                  onChange={(e) => setNokName(e.target.value)}
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 focus:outline-none focus:border-[hsl(var(--primary))]"
                />
              </Field>
              <Field label="Relation">
                <input
                  type="text"
                  required
                  value={nokRelation}
                  onChange={(e) => setNokRelation(e.target.value)}
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 focus:outline-none focus:border-[hsl(var(--primary))]"
                />
              </Field>
            </div>
            <Field label="Next-of-kin contact">
              <input
                type="text"
                required
                value={nokContact}
                onChange={(e) => setNokContact(e.target.value)}
                className="w-full rounded-lg border border-stone-200 px-3 py-2 font-mono focus:outline-none focus:border-[hsl(var(--primary))]"
              />
            </Field>
          </>
        )}

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="text-sm px-4 py-2 rounded-lg border border-stone-300 hover:bg-stone-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={update.isPending}
            className="text-sm px-4 py-2 rounded-lg bg-[hsl(var(--primary))] text-white hover:opacity-90 disabled:opacity-60"
          >
            {update.isPending ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1.5">
        {label}
      </span>
      {children}
    </label>
  );
}
