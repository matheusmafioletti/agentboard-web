import React, { useReducer, useCallback, useEffect } from "react";
import {
  getBoard,
  createFeature,
  updateFeature,
  deleteFeature,
  moveFeature,
  type CreateFeaturePayload,
  type UpdateFeaturePayload,
} from "../api/board";
import {
  boardReducer,
  initialBoardState,
  type BoardState,
  type BoardAction,
} from "../store/boardReducer";

/** Manages board state, providing CRUD and move actions for Feature Cards. */
export function useBoard(): BoardState & {
  createCard: (title: string, description?: string) => Promise<void>;
  updateCard: (id: string, patch: UpdateFeaturePayload) => Promise<void>;
  deleteCard: (id: string, columnId: string) => Promise<void>;
  moveCard: (
    cardId: string,
    fromColumnId: string,
    toColumnId: string,
    displayOrder: number
  ) => Promise<void>;
  refresh: () => Promise<void>;
  dispatch: React.Dispatch<BoardAction>;
} {
  const [state, dispatch] = useReducer(boardReducer, initialBoardState);

  const refresh = useCallback(async () => {
    dispatch({ type: "LOADING" });
    try {
      const board = await getBoard();
      dispatch({ type: "INIT_BOARD", payload: board });
    } catch (err) {
      dispatch({
        type: "ERROR",
        payload: err instanceof Error ? err.message : "Failed to load board",
      });
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createCard = useCallback(
    async (title: string, description?: string) => {
      const payload: CreateFeaturePayload = { title, description };
      const card = await createFeature(payload);
      dispatch({ type: "ADD_CARD", payload: { columnId: card.columnId, card } });
    },
    []
  );

  const updateCard = useCallback(
    async (id: string, patch: UpdateFeaturePayload) => {
      const card = await updateFeature(id, patch);
      dispatch({ type: "UPDATE_CARD", payload: { card } });
    },
    []
  );

  const deleteCard = useCallback(async (id: string, columnId: string) => {
    await deleteFeature(id);
    dispatch({ type: "DELETE_CARD", payload: { cardId: id, columnId } });
  }, []);

  const moveCard = useCallback(
    async (
      cardId: string,
      fromColumnId: string,
      toColumnId: string,
      displayOrder: number
    ) => {
      dispatch({
        type: "MOVE_CARD",
        payload: { cardId, fromColumnId, toColumnId, displayOrder },
      });
      try {
        await moveFeature(cardId, { targetColumnId: toColumnId, displayOrder });
      } catch {
        dispatch({
          type: "MOVE_CARD",
          payload: {
            cardId,
            fromColumnId: toColumnId,
            toColumnId: fromColumnId,
            displayOrder,
          },
        });
      }
    },
    []
  );

  return { ...state, createCard, updateCard, deleteCard, moveCard, refresh, dispatch };
}
