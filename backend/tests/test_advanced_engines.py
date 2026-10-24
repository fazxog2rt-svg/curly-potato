import pytest
from app.services.bkt_engine import bkt_engine
from app.services.irt_engine import irt_engine


def test_bkt_engine_mastery_update():
    # Initial low mastery
    initial_p = 0.15

    # Correct response should increase mastery
    p_after_correct = bkt_engine.update_mastery(initial_p, is_correct=True)
    assert p_after_correct > initial_p, "Mastery must increase after correct answer"

    # Second correct answer should increase mastery further
    p_after_correct_2 = bkt_engine.update_mastery(p_after_correct, is_correct=True)
    assert p_after_correct_2 > p_after_correct

    # Wrong answer should decrease or suppress mastery
    p_after_wrong = bkt_engine.update_mastery(p_after_correct_2, is_correct=False)
    assert p_after_wrong < p_after_correct_2, "Mastery must decrease after incorrect answer"


def test_bkt_status_classification():
    assert bkt_engine.classify_status(0.85) == "mastered"
    assert bkt_engine.classify_status(0.65) == "in_progress"
    assert bkt_engine.classify_status(0.30) == "needs_remedy"


def test_irt_engine_3pl_probability():
    # When ability theta equals difficulty b:
    # 2PL gives 0.50. In 3PL with c=0.20: P = 0.20 + 0.80*0.50 = 0.60
    p = irt_engine.probability_correct(theta=0.0, a=1.0, b=0.0, c=0.20)
    assert abs(p - 0.60) < 0.01

    # High ability student on easy question should have near 1.0 probability
    p_high = irt_engine.probability_correct(theta=2.5, a=1.0, b=-1.0, c=0.20)
    assert p_high > 0.90

    # Low ability student on hard question should asymptote at pseudo-guessing c
    p_low = irt_engine.probability_correct(theta=-2.5, a=1.0, b=2.0, c=0.20)
    assert abs(p_low - 0.20) < 0.05


def test_irt_adaptive_ability_estimation():
    # Student answers 3 hard questions correctly
    responses = [
        {"is_correct": True, "a": 1.2, "b": 0.5, "c": 0.2},
        {"is_correct": True, "a": 1.5, "b": 1.0, "c": 0.2},
        {"is_correct": True, "a": 1.8, "b": 1.5, "c": 0.2},
    ]
    theta_high = irt_engine.estimate_ability(responses)
    assert theta_high > 0.5, "Ability estimate must be above baseline for consecutive difficult correct answers"

    # Standard scaled score (200-1000)
    score = irt_engine.theta_to_scaled_score(theta_high)
    assert 650 <= score <= 1000
