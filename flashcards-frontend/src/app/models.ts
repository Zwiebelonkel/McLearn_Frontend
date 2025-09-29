export type Stack = { id: string; name: string; created_at: string; updated_at: string; is_public: boolean;};
export type Card = {
  id: string; stack_id: string; front: string; back: string;
  box: number; due_at: string; created_at: string; updated_at: string;
};