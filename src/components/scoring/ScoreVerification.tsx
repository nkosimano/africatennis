import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle } from 'lucide-react';
import type { Event } from '../../hooks/useEvents';

interface ScoreVerificationProps {
  event: Event;
  scores: Array<{
    set_number: number;
    score_team_a: number;
    score_team_b: number;
    tiebreak_score_team_a?: number;
    tiebreak_score_team_b?: number;
  }>;
  onVerify: (verified: boolean, reason?: string) => Promise<{ error: string | null }>;
  onClose: () => void;
}

export function ScoreVerification({
  // event, // removed unused parameter
  scores,
  onVerify,
  onClose,
}: ScoreVerificationProps) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerification = async (verified: boolean) => {
    setLoading(true);
    setError(null);

    const { error } = await onVerify(verified, verified ? undefined : reason);

    if (error) {
      setError(error);
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
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="glass rounded-xl p-6 w-full max-w-lg"
      >
        <h2 className="text-2xl font-bold mb-6">Verify Match Scores</h2>

        <div className="space-y-6">
          <div className="glass rounded-lg p-4">
            <h3 className="font-medium mb-2">Final Scores</h3>
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left font-medium opacity-80">Set</th>
                  <th className="text-center font-medium opacity-80">Team A</th>
                  <th className="text-center font-medium opacity-80">Team B</th>
                </tr>
              </thead>
              <tbody>
                {scores.map((score) => (
                  <tr key={score.set_number} className="border-t border-border">
                    <td className="py-2">{score.set_number}</td>
                    <td className="text-center py-2">
                      {score.score_team_a}
                      {score.tiebreak_score_team_a !== undefined && (
                        <span className="text-sm opacity-80">
                          ({score.tiebreak_score_team_a})
                        </span>
                      )}
                    </td>
                    <td className="text-center py-2">
                      {score.score_team_b}
                      {score.tiebreak_score_team_b !== undefined && (
                        <span className="text-sm opacity-80">
                          ({score.tiebreak_score_team_b})
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Reason for Dispute (if rejecting)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-2 bg-surface rounded-lg focus:ring-2 focus:ring-accent transition-all"
              rows={3}
              placeholder="Explain why you're disputing these scores..."
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          <div className="flex justify-end gap-3">
            <button
              onClick={() => handleVerification(false)}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 text-red-500 hover:bg-red-500 hover:bg-opacity-10 rounded-lg transition-colors"
            >
              <XCircle size={20} />
              <span>Dispute</span>
            </button>
            <button
              onClick={() => handleVerification(true)}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-accent text-primary rounded-lg hover:bg-opacity-90 transition-colors"
            >
              <CheckCircle size={20} />
              <span>Verify</span>
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}