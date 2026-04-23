import type {
  BoardData,
  ColumnData,
  FeatureCardDetail,
  FeatureCardSummary,
} from "../api/board";

export interface BoardState {
  board: BoardData | null;
  loading: boolean;
  error: string | null;
}

export type BoardAction =
  | { type: "LOADING" }
  | { type: "INIT_BOARD"; payload: BoardData }
  | { type: "ERROR"; payload: string }
  | { type: "ADD_CARD"; payload: { columnId: string; card: FeatureCardDetail } }
  | { type: "UPDATE_CARD"; payload: { card: FeatureCardDetail } }
  | { type: "DELETE_CARD"; payload: { cardId: string; columnId: string } }
  | {
      type: "MOVE_CARD";
      payload: {
        cardId: string;
        fromColumnId: string;
        toColumnId: string;
        displayOrder: number;
      };
    }
  | {
      type: "WS_CARD_UPDATED";
      payload: {
        cardId: string;
        title?: string;
        description?: string | null;
        reExecutionPending?: boolean;
        updatedAt?: string;
      };
    }
  | { type: "WS_CARD_DELETED"; payload: { cardId: string } }
  | { type: "WS_TASKS_CREATED"; payload: { featureCardId: string; count: number } }
  | { type: "WS_TASK_COMPLETED"; payload: { featureCardId: string } };

export const initialBoardState: BoardState = {
  board: null,
  loading: false,
  error: null,
};

function toSummary(card: FeatureCardDetail): FeatureCardSummary {
  return {
    id: card.id,
    title: card.title,
    description: card.description,
    reExecutionPending: card.reExecutionPending,
    taskCount: card.tasks?.length ?? 0,
    completedTaskCount: card.tasks?.filter((t) => t.completed).length ?? 0,
    displayOrder: card.displayOrder,
    createdAt: card.createdAt,
    updatedAt: card.updatedAt,
  };
}

export function boardReducer(
  state: BoardState,
  action: BoardAction
): BoardState {
  switch (action.type) {
    case "LOADING":
      return { ...state, loading: true, error: null };

    case "INIT_BOARD":
      return { board: action.payload, loading: false, error: null };

    case "ERROR":
      return { ...state, loading: false, error: action.payload };

    case "ADD_CARD": {
      if (!state.board) return state;
      const summary = toSummary(action.payload.card);
      const columns = state.board.columns.map((col): ColumnData => {
        if (col.id !== action.payload.columnId) return col;
        return { ...col, featureCards: [...col.featureCards, summary] };
      });
      return { ...state, board: { ...state.board, columns } };
    }

    case "UPDATE_CARD": {
      if (!state.board) return state;
      const summary = toSummary(action.payload.card);
      const columns = state.board.columns.map((col): ColumnData => {
        const idx = col.featureCards.findIndex((c) => c.id === summary.id);
        if (idx === -1) return col;
        const featureCards = [...col.featureCards];
        featureCards[idx] = summary;
        return { ...col, featureCards };
      });
      return { ...state, board: { ...state.board, columns } };
    }

    case "DELETE_CARD": {
      if (!state.board) return state;
      const columns = state.board.columns.map((col): ColumnData => {
        if (col.id !== action.payload.columnId) return col;
        return {
          ...col,
          featureCards: col.featureCards.filter(
            (c) => c.id !== action.payload.cardId
          ),
        };
      });
      return { ...state, board: { ...state.board, columns } };
    }

    case "MOVE_CARD": {
      if (!state.board) return state;
      let movedCard: FeatureCardSummary | undefined;
      let columns = state.board.columns.map((col): ColumnData => {
        if (col.id !== action.payload.fromColumnId) return col;
        const card = col.featureCards.find(
          (c) => c.id === action.payload.cardId
        );
        if (card) movedCard = { ...card, displayOrder: action.payload.displayOrder };
        return {
          ...col,
          featureCards: col.featureCards.filter(
            (c) => c.id !== action.payload.cardId
          ),
        };
      });
      if (movedCard) {
        columns = columns.map((col): ColumnData => {
          if (col.id !== action.payload.toColumnId) return col;
          return {
            ...col,
            featureCards: [...col.featureCards, movedCard!].sort(
              (a, b) => a.displayOrder - b.displayOrder
            ),
          };
        });
      }
      return { ...state, board: { ...state.board, columns } };
    }

    case "WS_CARD_UPDATED": {
      if (!state.board) return state;
      const { cardId, title, description, reExecutionPending, updatedAt } =
        action.payload;
      const columns = state.board.columns.map((col): ColumnData => {
        const idx = col.featureCards.findIndex((c) => c.id === cardId);
        if (idx === -1) return col;
        const featureCards = [...col.featureCards];
        const existing = featureCards[idx];
        featureCards[idx] = {
          ...existing,
          ...(title !== undefined && { title }),
          ...(description !== undefined && { description }),
          ...(reExecutionPending !== undefined && { reExecutionPending }),
          ...(updatedAt !== undefined && { updatedAt }),
        };
        return { ...col, featureCards };
      });
      return { ...state, board: { ...state.board, columns } };
    }

    case "WS_CARD_DELETED": {
      if (!state.board) return state;
      const columns = state.board.columns.map((col): ColumnData => ({
        ...col,
        featureCards: col.featureCards.filter(
          (c) => c.id !== action.payload.cardId
        ),
      }));
      return { ...state, board: { ...state.board, columns } };
    }

    case "WS_TASKS_CREATED": {
      if (!state.board) return state;
      const { featureCardId, count } = action.payload;
      const columns = state.board.columns.map((col): ColumnData => {
        const idx = col.featureCards.findIndex((c) => c.id === featureCardId);
        if (idx === -1) return col;
        const featureCards = [...col.featureCards];
        featureCards[idx] = {
          ...featureCards[idx],
          taskCount: featureCards[idx].taskCount + count,
        };
        return { ...col, featureCards };
      });
      return { ...state, board: { ...state.board, columns } };
    }

    case "WS_TASK_COMPLETED": {
      if (!state.board) return state;
      const { featureCardId } = action.payload;
      const columns = state.board.columns.map((col): ColumnData => {
        const idx = col.featureCards.findIndex((c) => c.id === featureCardId);
        if (idx === -1) return col;
        const featureCards = [...col.featureCards];
        featureCards[idx] = {
          ...featureCards[idx],
          completedTaskCount: featureCards[idx].completedTaskCount + 1,
        };
        return { ...col, featureCards };
      });
      return { ...state, board: { ...state.board, columns } };
    }

    default:
      return state;
  }
}
