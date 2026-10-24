import math
from typing import Dict, List, Optional, Tuple, Any

class IRTEngine:
    """
    Item Response Theory (IRT) Engine for Computerized Adaptive Testing (CAT).
    Uses the 3-Parameter Logistic (3PL) Model:
    P_i(theta) = c_i + (1 - c_i) / (1 + exp(-D * a_i * (theta - b_i)))
    Parameters:
    - theta: Student's latent ability (typically between -3.0 and +3.0)
    - a_i  : Discrimination parameter (default ~ 1.0)
    - b_i  : Difficulty parameter (-3.0 to +3.0)
    - c_i  : Pseudo-guessing parameter (default ~ 0.20 for 5-choice items)
    - D    : Scaling constant (1.702 to approximate normal ogive)
    """

    D = 1.702
    DEFAULT_THETA = 0.0 # Neutral baseline ability

    @classmethod
    def probability_correct(
        cls,
        theta: float,
        a: float = 1.0,
        b: float = 0.0,
        c: float = 0.20,
    ) -> float:
        """Calculates probability of correct answer under 3PL model."""
        exponent = -cls.D * a * (theta - b)
        # Protect against float overflow
        exponent = max(-35.0, min(35.0, exponent))
        exp_val = math.exp(exponent)
        return c + (1.0 - c) / (1.0 + exp_val)

    @classmethod
    def fisher_information(
        cls,
        theta: float,
        a: float = 1.0,
        b: float = 0.0,
        c: float = 0.20,
    ) -> float:
        """
        Fisher Information I_i(theta) provided by an item at ability level theta.
        Higher information means greater precision in ability measurement.
        """
        p = cls.probability_correct(theta, a, b, c)
        q = 1.0 - p
        p_star = (p - c) / max(1e-6, (1.0 - c)) # 2PL equivalent portion
        numerator = (cls.D * a) ** 2 * q * (p_star ** 2)
        denominator = p
        return numerator / max(1e-6, denominator)

    @classmethod
    def estimate_ability(
        cls,
        responses: List[Dict[str, Any]],
        current_theta: float = DEFAULT_THETA,
        max_iterations: int = 15,
        tolerance: float = 0.005,
    ) -> float:
        """
        Estimates theta via Newton-Raphson Maximum Likelihood Estimation (MLE)
        with Bayesian normal prior dampening to prevent divergence on all-correct / all-wrong.
        """
        if not responses:
            return cls.DEFAULT_THETA

        theta = current_theta

        for _ in range(max_iterations):
            first_derivative = 0.0
            second_derivative = 0.0

            for resp in responses:
                is_correct = 1.0 if resp.get("is_correct") else 0.0
                a = resp.get("a", 1.0)
                b = resp.get("b", 0.0)
                c = resp.get("c", 0.20)

                p = cls.probability_correct(theta, a, b, c)
                q = 1.0 - p
                p_star = (p - c) / max(1e-6, (1.0 - c))

                # Gradient
                dL = cls.D * a * p_star * (is_correct - p) / max(1e-6, p)
                first_derivative += dL

                # Fisher information as negative expected 2nd derivative
                info = cls.fisher_information(theta, a, b, c)
                second_derivative -= info

            # Add gentle N(0, 1) prior regularizer (Empirical Bayes dampening)
            first_derivative -= theta
            second_derivative -= 1.0

            if abs(second_derivative) < 1e-6:
                break

            step = first_derivative / second_derivative
            # Clamp step to prevent oscillation
            step = max(-1.0, min(1.0, step))
            theta = theta - step

            # Clamp theta to realistic standard score range [-3.5, +3.5]
            theta = max(-3.5, min(3.5, theta))

            if abs(step) < tolerance:
                break

        return round(float(theta), 3)

    @classmethod
    def select_next_item(
        cls,
        current_theta: float,
        available_items: List[Dict[str, Any]],
        administered_ids: List[str],
    ) -> Optional[Dict[str, Any]]:
        """
        Selects the item that maximizes Fisher Information at current ability level theta.
        """
        candidates = [it for it in available_items if it["id"] not in administered_ids]
        if not candidates:
            return None

        # Sort candidates by descending Fisher Information
        best_item = max(
            candidates,
            key=lambda it: cls.fisher_information(
                current_theta,
                a=it.get("a", 1.0),
                b=it.get("b", 0.0),
                c=it.get("c", 0.20),
            ),
        )
        return best_item

    @classmethod
    def theta_to_scaled_score(cls, theta: float) -> int:
        """
        Converts latent trait theta (-3.0 to +3.0) to standardized exam scale (200 - 1000).
        Analogous to SAT / UTBK standard scale (Mean: 600, SD: 100).
        """
        scaled = 600 + (theta * 100)
        return int(max(200, min(1000, round(scaled))))

    @classmethod
    def classify_proficiency(cls, theta: float) -> Dict[str, str]:
        """Provides descriptive diagnostic category based on theta."""
        if theta >= 1.5:
            return {"grade": "A+", "level": "Mastery (Sangat Mahir)", "badge": "🌟 Elit Akademik"}
        elif theta >= 0.8:
            return {"grade": "A", "level": "Advanced (Mahir)", "badge": "🎯 Kompeten Tinggi"}
        elif theta >= 0.0:
            return {"grade": "B", "level": "Proficient (Cukup)", "badge": "📚 Standar Kompetensi"}
        elif theta >= -1.0:
            return {"grade": "C", "level": "Developing (Perlu Bimbingan)", "badge": "⚠️ Fondasi Rapuh"}
        else:
            return {"grade": "D", "level": "Novice (Remedial Kritis)", "badge": "🚨 Perlu Remedial Total"}

irt_engine = IRTEngine()
