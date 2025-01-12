import { useDrag, useDrop } from "react-dnd";
import { DragItem } from "../types";

export function useColleagueDrag(
  id: string,
  index: number,
  moveColleague: (dragIndex: number, hoverIndex: number) => void,
) {
  const [{ isDragging }, drag] = useDrag({
    type: "colleague",
    item: { id, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: "colleague",
    hover: (item: DragItem, monitor) => {
      if (!monitor.isOver({ shallow: true })) return;
      const dragIndex = item.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) return;
      moveColleague(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  return {
    isDragging,
    dragRef: (node: HTMLElement | null) => drag(drop(node)),
  };
}
