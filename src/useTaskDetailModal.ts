import { createElement, useRef, useState, type ReactElement } from "react";
import type { SplitTodo } from "./data";
import { TaskDetailModal } from "./TaskDetailModal";

export function useTaskDetailModal(todos: SplitTodo[]): {
  open: (id: string, trigger: HTMLElement) => void;
  modalElement: ReactElement | null;
} {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  const open = (id: string, trigger: HTMLElement) => {
    triggerRef.current = trigger;
    setSelectedId(id);
  };

  const close = () => {
    setSelectedId(null);
    requestAnimationFrame(() => {
      triggerRef.current?.focus();
    });
  };

  const todo = todos.find((t) => t.id === selectedId) ?? null;
  const modalElement = todo
    ? createElement(TaskDetailModal, { todo, onClose: close })
    : null;

  return { open, modalElement };
}
