import { useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";

export function ConfirmDialog({ open, title, message, confirmLabel = "Delete", busy, onCancel, onConfirm }) {
  // Lock background scroll while the dialog is open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Render via portal: ancestors use framer-motion transforms, which break
  // position:fixed and made the dialog flash in the wrong spot on open.
  // Portaling to body keeps it stable and correctly centered.
  //
  // Backdrop and card are SIBLINGS, not parent/child: a fading parent would
  // multiply its opacity into the card and leave it translucent mid-animation
  // (the flicker in the bug report). The card animates transform only and is
  // always fully opaque.
  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.2 } }}
            exit={{ opacity: 0, transition: { duration: 0.16 } }}
          />
          <motion.div
            key="card"
            className="modal-centering"
            initial={{ y: 14, scale: 0.98 }}
            animate={{ y: 0, scale: 1, transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] } }}
            exit={{ y: 8, scale: 0.98, transition: { duration: 0.14 } }}
            onClick={() => {
              if (!busy) onCancel();
            }}
          >
            <div
              className="modal"
              role="alertdialog"
              aria-modal="true"
              aria-label={title}
              style={{ width: "min(400px, 100%)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2>{title}</h2>
              <p className="confirm-text">{message}</p>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={busy}>Cancel</button>
                <button type="button" className="btn btn-danger" onClick={onConfirm} disabled={busy}>
                  {busy && <span className="spin" />}
                  {confirmLabel}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
