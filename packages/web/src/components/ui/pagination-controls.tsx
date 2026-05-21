import { HStack, Button, Text } from '@chakra-ui/react';
import { LuChevronLeft, LuChevronRight } from 'react-icons/lu';
import type { PaginationMeta } from '@alentapp/shared';

interface PaginationControlsProps {
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
}

export function PaginationControls({ pagination, onPageChange }: PaginationControlsProps) {
  const { page, total, total_pages, page_size } = pagination;
  const isFirst = page <= 1;
  const isLast = page >= total_pages || total_pages === 0;

  const from = total === 0 ? 0 : (page - 1) * page_size + 1;
  const to = Math.min(page * page_size, total);

  return (
    <HStack justify="space-between" px="4" py="3" borderTopWidth="1px">
      <Text fontSize="sm" color="fg.muted">
        {total === 0
          ? 'Sin resultados'
          : `Mostrando ${from}–${to} de ${total}`}
      </Text>
      <HStack gap="2">
        <Button
          size="sm"
          variant="outline"
          disabled={isFirst}
          onClick={() => onPageChange(page - 1)}
          aria-label="Página anterior"
        >
          <LuChevronLeft /> Anterior
        </Button>
        <Text fontSize="sm" color="fg.muted">
          Página {total_pages === 0 ? 0 : page} de {total_pages}
        </Text>
        <Button
          size="sm"
          variant="outline"
          disabled={isLast}
          onClick={() => onPageChange(page + 1)}
          aria-label="Página siguiente"
        >
          Siguiente <LuChevronRight />
        </Button>
      </HStack>
    </HStack>
  );
}
