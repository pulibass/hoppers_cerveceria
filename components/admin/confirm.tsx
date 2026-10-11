"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

// Promise-based confirmation dialog (native <dialog>) for destructive actions.

type ConfirmOptions = { title: string; message: string; confirmLabel?: string; danger?: boolean };
type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn>(async () => false);

export function useConfirm(): ConfirmFn {
  return useContext(ConfirmContext);
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [request, setRequest] = useState<(ConfirmOptions & { resolve: (value: boolean) => void }) | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  const confirm = useCallback<ConfirmFn>(options => new Promise(resolve => setRequest({ ...options, resolve })), []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (request && !dialog.open) {
      dialog.showModal();
      // Safer default for destructive actions: focus "Cancelar".
      cancelRef.current?.focus();
    }
  }, [request]);

  const finish = (value: boolean) => {
    request?.resolve(value);
    setRequest(null);
    if (dialogRef.current?.open) dialogRef.current.close();
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <dialog ref={dialogRef} className="confirm-dialog" aria-labelledby="confirm-title" aria-describedby="confirm-message"
        onCancel={event => { event.preventDefault(); finish(false); }}>
        {request && (
          <div className="confirm-panel">
            <h2 id="confirm-title">{request.title}</h2>
            <p id="confirm-message">{request.message}</p>
            <div className="confirm-actions">
              <button ref={cancelRef} type="button" className="btn btn-ghost" onClick={() => finish(false)}>Cancelar</button>
              <button type="button" className={`btn ${request.danger ? "btn-danger" : "btn-primary"}`} onClick={() => finish(true)}>
                {request.confirmLabel ?? "Confirmar"}
              </button>
            </div>
          </div>
        )}
      </dialog>
    </ConfirmContext.Provider>
  );
}
