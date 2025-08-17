import React, { useState } from 'react';
import toast from 'react-hot-toast';

type Props = {
  getRecipeUuid: () => Promise<string>; // must return a local UUID (we'll ensure for MealDB)
  recipeName: string;
  className?: string;
  children?: React.ReactNode;
  onScheduled?: () => void; // optional callback
  scheduleFn: (args: { recipeId: string; recipeName: string; date: string; slot: string; notes?: string }) => Promise<any>;
};

const SLOTS = ['Breakfast', 'Lunch', 'Dinner', 'Snack'] as const;

const AddToPlannerButton: React.FC<Props> = ({ getRecipeUuid, recipeName, className, children, onScheduled, scheduleFn }) => {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0,10)); // yyyy-mm-dd
  const [slot, setSlot] = useState<string>('Dinner');
  const [notes, setNotes] = useState<string>('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    try {
      setBusy(true);
      const recipeId = await getRecipeUuid();
      if (!recipeId) throw new Error('Missing recipe id');
      if (!date) throw new Error('Please pick a date');

      await scheduleFn({ recipeId, recipeName, date, slot, notes });
      toast.success('Added to planner');
      setOpen(false);
      onScheduled?.();
    } catch (e: any) {
      console.error('[AddToPlannerButton] schedule failed', e);
      toast.error(e?.message || 'Failed to save to planner');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={className ?? 'px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm'}
      >
        {children ?? '📅 Add to Planner'}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => !busy && setOpen(false)}>
          <div className="bg-white rounded-xl p-4 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-3">Schedule "{recipeName}"</h3>

            <label className="block text-sm mb-2">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border rounded-lg p-2 mb-3"
            />

            <label className="block text-sm mb-2">Meal</label>
            <select value={slot} onChange={(e) => setSlot(e.target.value)} className="w-full border rounded-lg p-2 mb-3">
              {SLOTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            <label className="block text-sm mb-2">Notes (optional)</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full border rounded-lg p-2 mb-4" rows={2} />

            <div className="flex gap-2">
              <button
                onClick={() => setOpen(false)}
                disabled={busy}
                className="flex-1 border rounded-lg py-2"
              >
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={busy}
                className="flex-1 bg-coral-blush text-white rounded-lg py-2 disabled:opacity-50"
              >
                {busy ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AddToPlannerButton;
