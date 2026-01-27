"""
V.I.B.E. Scorer - NOON Governance Instrument #2

Calculates code quality based on:
- Verifiable: Can be independently checked
- Idempotent: Same input → same output
- Bounded: Defined limits and constraints  
- Evident: Audit trail exists

Purpose: Quality gate enforcement
Threshold: ≥0.85 for execution, ≥0.995 for governance
"""

import ast
import re
from typing import Dict,List, Optional


class VIBEScorer:
    """V.I.B.E. Framework implementation for code quality assessment"""
    
    # Thresholds
    EXECUTION_THRESHOLD = 0.85
    GOVERNANCE_THRESHOLD = 0.995
    
    def __init__(self):
        self.last_score = None
    
    def score_code(self, code: str, language: str = "python") -> Dict:
        """
        Calculate V.I.B.E. score for code
        
        Args:
            code: Source code to analyze
            language: Programming language (python, javascript, etc.)
            
        Returns:
            {
                "verifiable": float,
                "idempotent": float,
                "bounded": float,
                "evident": float,
                "vibe_score": float,
                "pass_execution": bool,
                "pass_governance": bool,
                "recommendations": List[str]
            }
        """
        if language == "python":
            return self._score_python(code)
        elif language in ["javascript", "typescript"]:
            return self._score_javascript(code)
        else:
            # Generic scoring for other languages
            return self._score_generic(code)
    
    def _score_python(self, code: str) -> Dict:
        """Score Python code"""
        try:
            tree = ast.parse(code)
        except SyntaxError:
            return self._create_score_result(0, 0, 0, 0, ["Code has syntax errors"])
        
        # Verifiable: Has tests, type hints, docstrings
        verifiable = self._calculate_verifiable_python(code,tree)
        
        # Idempotent: Pure functions, no global state mutation
        idempotent = self._calculate_idempotent_python(tree)
        
        # Bounded: Error handling, input validation, resource limits
        bounded = self._calculate_bounded_python(tree)
        
        # Evident: Logging, return values, audit trails
        evident = self._calculate_evident_python(tree, code)
        
        return self._create_score_result(verifiable, idempotent, bounded, evident)
    
    def _calculate_verifiable_python(self, code: str, tree: ast.AST) -> float:
        """Calculate Verifiable score for Python"""
        score = 0.5  # Base score
        
        # Has docstrings?
        has_docstring = ast.get_docstring(tree) is not None
        if has_docstring:
            score += 0.2
        
        # Has type hints?
        type_hint_count = code.count(":") + code.count("->")
        if type_hint_count > 2:
            score += 0.2
        
        # Has assertions or tests?
        if "assert" in code or "test_" in code:
            score += 0.1
        
        return min(1.0, score)
    
    def _calculate_idempotent_python(self, tree: ast.AST) -> float:
        """Calculate Idempotent score for Python"""
        score = 0.7  # Optimistic base
        
        # Check for global variable mutations
        for node in ast.walk(tree):
            if isinstance(node, ast.Global):
                score -= 0.2
            if isinstance(node, ast.Nonlocal):
                score -= 0.1
        
        # Check for side effects (print, file operations without context)
        side_effect_calls = 0
        for node in ast.walk(tree):
            if isinstance(node, ast.Call):
                if isinstance(node.func, ast.Name):
                    if node.func.id in ["print", "open", "exec", "eval"]:
                        side_effect_calls += 1
        
        score -= min(0.3, side_effect_calls * 0.1)
        
        return max(0.0, score)
    
    def _calculate_bounded_python(self, tree: ast.AST) -> float:
        """Calculate Bounded score for Python"""
        score = 0.3  # Pessimistic base
        
        # Has try-except blocks?
        has_error_handling = any(isinstance(node, ast.Try) for node in ast.walk(tree))
        if has_error_handling:
            score += 0.3
        
        # Has input validation (if statements checking params)?
        has_validation = any(
            isinstance(node, ast.If) for node in ast.walk(tree)
        )
        if has_validation:
            score += 0.2
        
        # Has resource cleanup (with statements, finally blocks)?
        has_cleanup = any(
            isinstance(node, (ast.With, ast.Try)) for node in ast.walk(tree)
        )
        if has_cleanup:
            score += 0.2
        
        return min(1.0, score)
    
    def _calculate_evident_python(self, tree: ast.AST, code: str) -> float:
        """Calculate Evident score for Python"""
        score = 0.4  # Base score
        
        # Has logging statements?
        if "logging." in code or "logger." in code:
            score += 0.3
        
        # Returns values (not just side effects)?
        has_returns = any(isinstance(node, ast.Return) for node in ast.walk(tree))
        if has_returns:
            score += 0.2
        
        # Has comments explaining logic?
        comment_count = code.count("#")
        if comment_count > 2:
            score += 0.1
        
        return min(1.0, score)
    
    def _score_javascript(self, code: str) -> Dict:
        """Score JavaScript/TypeScript code (simplified pattern matching)"""
        # Verifiable: Has JSDocs, types (TypeScript), tests
        verifiable = 0.5
        if "/**" in code or "@param" in code:
            verifiable += 0.2
        if ": " in code and "=>" in code:  # Type hints
            verifiable += 0.2
        if "expect(" in code or "assert" in code:
            verifiable += 0.1
        
        # Idempotent: Pure functions, no global mutations
        idempotent = 0.7
        if "window." in code or "global." in code:
            idempotent -= 0.2
        if "let " in code:  # Mutable variables
            idempotent -= 0.1
        
        # Bounded: try-catch, validation
        bounded = 0.3
        if "try {" in code:
            bounded += 0.3
        if "if (" in code:
            bounded += 0.2
        
        # Evident: console.log, return statements
        evident = 0.4
        if "console.log" in code or "logger." in code:
            evident += 0.3
        if "return" in code:
            evident += 0.2
        
        return self._create_score_result(verifiable, idempotent, bounded, evident)
    
    def _score_generic(self, code: str) -> Dict:
        """Generic scoring for unknown languages"""
        # Conservative estimates
        return self._create_score_result(0.6, 0.6, 0.5, 0.6)
    
    def _create_score_result(
        self, 
        verifiable: float, 
        idempotent: float, 
        bounded: float, 
        evident: float,
        extra_recommendations: List[str] = None
    ) -> Dict:
        """Create standardized score result"""
        vibe_score = (verifiable + idempotent + bounded + evident) / 4
        
        recommendations = extra_recommendations or []
        
        # Add score-specific recommendations
        if verifiable < 0.7:
            recommendations.append("Add docstrings, type hints, or tests for better verifiability")
        if idempotent < 0.7:
            recommendations.append("Reduce side effects and global state mutations for idempotency")
        if bounded < 0.7:
            recommendations.append("Add error handling, input validation, and resource limits")
        if evident < 0.7:
            recommendations.append("Add logging and audit trails for evidence")
        
        self.last_score = {
            "verifiable": round(verifiable, 2),
            "idempotent": round(idempotent, 2),
            "bounded": round(bounded, 2),
            "evident": round(evident, 2),
            "vibe_score": round(vibe_score, 2),
            "pass_execution": vibe_score >= self.EXECUTION_THRESHOLD,
            "pass_governance": vibe_score >= self.GOVERNANCE_THRESHOLD,
            "recommendations": recommendations
        }
        
        return self.last_score
    
    def generate_report(self, score_result: Optional[Dict] = None) -> str:
        """Generate human-readable V.I.B.E. report"""
        result = score_result or self.last_score
        if not result:
            return "No V.I.B.E. score available. Run score_code() first."
        
        report = "📊 V.I.B.E. Quality Report\n\n"
        report += f"V (Verifiable): {result['verifiable']:.2f}\n"
        report += f"I (Idempotent): {result['idempotent']:.2f}\n"
        report += f"B (Bounded):    {result['bounded']:.2f}\n"
        report += f"E (Evident):    {result['evident']:.2f}\n\n"
        report += f"Overall V.I.B.E. Score: {result['vibe_score']:.2f}\n\n"
        
        # Thresholds
        exec_status = "✅ PASS" if result['pass_execution'] else "❌ FAIL"
        gov_status = "✅ PASS" if result['pass_governance'] else "❌ FAIL"
        
        report += f"Execution Threshold (0.85): {exec_status}\n"
        report += f"Governance Threshold (0.995): {gov_status}\n\n"
        
        if result['recommendations']:
            report += "Recommendations:\n"
            for i, rec in enumerate(result['recommendations'], 1):
                report += f"  {i}. {rec}\n"
        
        return report


# Tool interface for Agent Zero
def check_vibe(code: str, language: str = "python") -> str:
    """
    Agent Zero tool to check V.I.B.E. score
    
    Usage in prompts:
    "Check the quality of this code: check_vibe(generated_code)"
    """
    scorer = VIBEScorer()
    result = scorer.score_code(code, language)
    report = scorer.generate_report(result)
    
    if not result['pass_execution']:
        report += "\n🛑 HALT: V.I.B.E. score below execution threshold (0.85)\n"
        report += "Action Required: Improve code quality before committing\n"
    
    return report


# Example usage
if __name__ == "__main__":
    scorer = VIBEScorer()
    
    # Good code example
    good_code = '''
def calculate_total(items: list[float]) -> float:
    """Calculate total price with error handling."""
    if not items or not all(isinstance(x, (int, float)) for x in items):
        raise ValueError("Invalid items list")
    
    total = sum(items)
    logging.info(f"Calculated total: {total}")
    return total
    '''
    
    result = scorer.score_code(good_code)
    print(scorer.generate_report())
    
    print("\n" + "="*50 + "\n")
    
    # Bad code example
    bad_code = '''
total = 0
def add(x):
    global total
    total += x
    print(total)
    '''
    
    result2 = scorer.score_code(bad_code)
    print(scorer.generate_report())
