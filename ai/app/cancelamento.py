import asyncio
import logging
from collections.abc import Coroutine
from contextlib import suppress
from typing import Any, TypeVar

from fastapi import Request

logger = logging.getLogger(__name__)
T = TypeVar("T")


class RequisicaoCanceladaPeloCliente(Exception):
    """Exceção lançada quando o cliente fecha a conexão durante o processamento."""


async def _aguardar_desconexao(http_request: Request) -> None:
    while True:
        mensagem = await http_request.receive()
        if mensagem.get("type") == "http.disconnect":
            return


async def executar_ate_desconectar(
    http_request: Request,
    corrotina: Coroutine[Any, Any, T],
) -> T:
    """Executa uma corrotina e a cancela imediatamente se o cliente desconectar."""
    tarefa_principal = asyncio.create_task(corrotina)
    tarefa_desconexao = asyncio.create_task(_aguardar_desconexao(http_request))

    try:
        concluidas, _ = await asyncio.wait(
            {tarefa_principal, tarefa_desconexao},
            return_when=asyncio.FIRST_COMPLETED,
        )

        if tarefa_principal in concluidas:
            return await tarefa_principal

        logger.info(
            "event=ai_request_cancelled_by_client path=%s",
            http_request.url.path,
        )
        tarefa_principal.cancel()
        with suppress(asyncio.CancelledError):
            await tarefa_principal
        raise RequisicaoCanceladaPeloCliente()
    finally:
        if not tarefa_desconexao.done():
            tarefa_desconexao.cancel()
        with suppress(asyncio.CancelledError):
            await tarefa_desconexao
        if not tarefa_principal.done():
            tarefa_principal.cancel()
            with suppress(asyncio.CancelledError):
                await tarefa_principal
