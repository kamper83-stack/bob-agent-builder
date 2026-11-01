"""Root conftest — adds the repo root to sys.path so `from src import ...` works."""
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))
