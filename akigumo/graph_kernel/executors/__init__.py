import importlib
import inspect
import pkgutil

from akigumo.graph_kernel.core.executor import BaseExecutor
from akigumo.graph_kernel.executors.base import GenericNodeBase


def _collect_executors():
    found_executors = []

    for _, module_name, _ in pkgutil.iter_modules(__path__):
        if module_name == "base":
            continue

        module = importlib.import_module(f"{__name__}.{module_name}")

        # 尋找該模組內所有繼承自 BaseExecutor 的類別
        for name, obj in inspect.getmembers(module, inspect.isclass):
            if issubclass(obj, BaseExecutor) and obj is not GenericNodeBase:
                found_executors.append(obj)
    return found_executors


def load_executors():
    """Load all BaseExecutor implementations from the executors package."""
    executors_map = {}
    for executor in _collect_executors():
        executors_map[executor.__name__] = executor
        if hasattr(executor, 'TASK_TYPES'):
            for t_type in executor.TASK_TYPES:
                executors_map[t_type] = executor

    return executors_map
