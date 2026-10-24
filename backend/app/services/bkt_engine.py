import math
from typing import Dict, List, Optional, Tuple, Any

class BKTEngine:
    """
    Bayesian Knowledge Tracing (BKT) Engine for probabilistic concept mastery modeling.
    Standard Parameters:
    - P(L0): Prior knowledge probability (initial belief)
    - P(T) : Transition probability (learning step rate)
    - P(G) : Guess probability (correct answer despite not knowing)
    - P(S) : Slip probability (incorrect answer despite knowing)
    """

    DEFAULT_P_TRANSIT = 0.15
    DEFAULT_P_SLIP = 0.10
    DEFAULT_P_GUESS = 0.20
    DEFAULT_P_INIT = 0.15

    @classmethod
    def update_mastery(
        cls,
        current_p_know: float,
        is_correct: bool,
        p_slip: float = DEFAULT_P_SLIP,
        p_guess: float = DEFAULT_P_GUESS,
        p_transit: float = DEFAULT_P_TRANSIT,
    ) -> float:
        """
        Calculates updated probability of concept mastery P(L_t) given observation.
        """
        # Clamp inputs
        p_know = max(0.01, min(0.99, current_p_know))
        p_s = max(0.01, min(0.40, p_slip))
        p_g = max(0.01, min(0.40, p_guess))
        p_t = max(0.01, min(0.50, p_transit))

        # Posterior calculation P(L_{t-1} | Obs)
        if is_correct:
            numerator = p_know * (1.0 - p_s)
            denominator = numerator + (1.0 - p_know) * p_g
        else:
            numerator = p_know * p_s
            denominator = numerator + (1.0 - p_know) * (1.0 - p_g)

        posterior = numerator / max(1e-9, denominator)

        # Transition forward P(L_t) = posterior + (1 - posterior) * P(T)
        updated_p_know = posterior + (1.0 - posterior) * p_t
        return round(float(max(0.01, min(0.99, updated_p_know))), 4)

    @classmethod
    def classify_status(cls, p_know: float) -> str:
        """Categorize mastery into visual status."""
        if p_know >= 0.80:
            return "mastered"     # Hijau
        elif p_know >= 0.50:
            return "in_progress"  # Kuning
        return "needs_remedy"     # Merah

    @classmethod
    def backtrack_weak_prerequisites(
        cls,
        target_node_id: str,
        nodes_dict: Dict[str, Dict[str, Any]],
        user_states: Dict[str, float],
    ) -> List[Dict[str, Any]]:
        """
        Traverses prerequisite dependencies to find upstream concept bottlenecks.
        """
        weak_bottlenecks = []
        visited = set()

        def dfs(node_id: str):
            if node_id in visited or node_id not in nodes_dict:
                return
            visited.add(node_id)
            node = nodes_dict[node_id]
            prereqs = node.get("prerequisites", [])

            for pre_id in prereqs:
                p_know = user_states.get(pre_id, cls.DEFAULT_P_INIT)
                if p_know < 0.65:
                    pre_node = nodes_dict.get(pre_id, {"title": pre_id})
                    weak_bottlenecks.append({
                        "node_id": pre_id,
                        "title": pre_node.get("title", pre_id),
                        "mastery": p_know,
                        "status": cls.classify_status(p_know),
                        "reason": f"Prasyarat penting untuk '{node.get('title', node_id)}' belum dikuasai (tingkat pemahaman {int(p_know * 100)}%).",
                    })
                dfs(pre_id)

        dfs(target_node_id)
        # Sort bottlenecks starting with lowest mastery first
        weak_bottlenecks.sort(key=lambda x: x["mastery"])
        return weak_bottlenecks

    @classmethod
    def generate_recommended_path(
        cls,
        nodes: List[Dict[str, Any]],
        user_states: Dict[str, float],
    ) -> List[Dict[str, Any]]:
        """
        Returns an ordered optimal sequence of concepts to learn based on prerequisites and gaps.
        """
        path = []
        for n in nodes:
            nid = n["id"]
            p_know = user_states.get(nid, cls.DEFAULT_P_INIT)
            prereqs = n.get("prerequisites", [])

            # Check if all prerequisites are sufficiently known (>= 0.60)
            prereqs_met = all(user_states.get(p, cls.DEFAULT_P_INIT) >= 0.60 for p in prereqs)

            priority = 0
            if p_know < 0.80 and prereqs_met:
                priority = 100 - int(p_know * 100) # Lower mastery = higher priority
            elif not prereqs_met:
                priority = 10 # Blocked by prereqs
            else:
                priority = 5  # Already mastered

            path.append({
                **n,
                "mastery": p_know,
                "status": cls.classify_status(p_know),
                "is_unlocked": prereqs_met,
                "priority_score": priority,
            })

        path.sort(key=lambda x: (-x["priority_score"], x.get("difficulty", "beginner")))
        return path

bkt_engine = BKTEngine()
