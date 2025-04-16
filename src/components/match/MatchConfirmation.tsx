import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, X } from 'lucide-react';
import type { Event } from '../../hooks/useEvents';

interface MatchConfirmationProps {
  match: Event;
  onConfirm: () => Promise<{ error: string | null }>;
  onDispute: (reason: string) => Promise<{ error: string | null }>;
  onClose: () => void;
}

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  return 'An unexpected error occurred';
};

export function MatchConfirmation({
  match,
  onConfirm,
  onDispute,
  onClose,
}: MatchConfirmationProps) {
  const [disputeReason, setDisputeReason] = useState('');
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);
    const { error } = await onConfirm();
    if (error) {
      setError(getErrorMessage(error));
      setLoading(false);
    } else {
      onClose();
    }
  };

  const handleDispute = async () => {
    if (!disputeReason) {
      setError('Please provide a reason for the dispute');
      return;
    }

    setLoading(true);
    setError(null);
    const { error } = await onDispute(disputeReason);
    if (error) {
      setError(getErrorMessage(error));
      setLoading(false);
    } else {
      onClose();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      data-testid="match-confirmation-modal"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="glass rounded-xl p-6 w-full max-w-md"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold" data-testid="match-confirmation-title">
            Confirm Match Result
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-hover rounded-lg transition-colors"
            data-testid="match-confirmation-close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6">
          <div className="glass rounded-lg p-4" data-testid="match-details">
            <h3 className="font-medium mb-2">Match Details</h3>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="opacity-80">Date:</dt>
                <dd>{new Date(match.scheduled_start_time).toLocaleDateString()}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="opacity-80">Type:</dt>
                <dd className="capitalize">{match.event_type.replace(/_/g, ' ')}</dd>
              </div>
            </dl>
          </div>

          {!showDisputeForm ? (
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDisputeForm(true)}
                className="flex items-center gap-2 px-4 py-2 text-red-500 hover:bg-red-500 hover:bg-opacity-10 rounded-lg transition-colors"
                data-testid="match-dispute-button"
              >
                <AlertTriangle size={20} />
                <span>Dispute</span>
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-accent text-primary rounded-lg hover:bg-opacity-90 transition-colors"
                data-testid="match-confirm-button"
              >
                <CheckCircle size={20} />
                <span>Confirm</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Reason for Dispute</label>
                <textarea
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  className="w-full p-2 bg-surface rounded-lg focus:ring-2 focus:ring-accent transition-all"
                  rows={3}
                  placeholder="Please explain why you're disputing this match result..."
                  data-testid="dispute-reason-input"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDisputeForm(false)}
                  className="px-4 py-2 rounded-lg hover:bg-surface-hover transition-colors"
                  data-testid="dispute-cancel-button"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDispute}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-opacity-90 transition-colors"
                  data-testid="dispute-submit-button"
                >
                  <XCircle size={20} />
                  <span>Submit Dispute</span>
                </button>
              </div>
            </div>
          )}

          {error && (
            <p className="text-red-500 text-sm" data-testid="match-confirmation-error">{error}</p>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}