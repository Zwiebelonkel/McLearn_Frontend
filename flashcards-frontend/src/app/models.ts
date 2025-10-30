export type Stack = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  is_public: boolean;
  user_id: number;
  owner_name?: string;
  card_amount?: number;
  collaborators?: StackCollaborator[];
};
export type Card = {
  id: string;
  stack_id: string;
  front: string;
  back: string;
  box: number;
  due_at: string;
  created_at: string;
  updated_at: string;
  front_image?: string;
};
export type StackCollaborator = {
  id: string;
  stack_id: string;
  user_id: number;
  user_name: string;
  can_edit: boolean;
};
export type User = {
  id: number;
  name: string;
};

export interface FriendRequest {
  id: number;
  sender_id: number;
  receiver_id: number;
  name: string;
}
