"""
Forbidden Value Scanner - NOON Governance Instrument #1

Scans all Charter (customer-safe) outputs for forbidden internal values
that should only appear in Ledger (audit) logs.

Purpose: Enforce Charter-Ledger separation
V.I.B.E. Component: Verifiable (V) + Bounded (B)
"""

import re
from typing import Dict, List, Tuple


class ForbiddenValueScanner:
    """Scanner for detecting internal costs and margins in customer-facing outputs"""
    
    # Forbidden patterns that should NEVER appear in Charter
    FORBIDDEN_PATTERNS = {
        "internal_costs": [
            r"\$0\.039",  # Gemini cost
            r"\$8\.00",   # ElevenLabs cost
            r"\$0\.0005", # Deepgram cost per second
        ],
        "markup_percentages": [
            r"300%",
            r"365%",
            r"\d{3}%\s*markup",
        ],
        "provider_internal_names": [
            r"internal\s+rate",
            r"provider\s+cost",
            r"wholesale\s+price",
        ],
        "api_keys": [
            r"sk-[a-zA-Z0-9]{48}",  # OpenAI key pattern
            r"AIza[a-zA-Z0-9\-_]{35}",  # Google API key
        ],
    }
    
    def __init__(self):
        self.compiled_patterns = {}
        for category, patterns in self.FORBIDDEN_PATTERNS.items():
            self.compiled_patterns[category] = [
                re.compile(pattern, re.IGNORECASE) for pattern in patterns
            ]
    
    def scan_text(self, text: str, log_type: str = "charter") -> Dict:
        """
        Scan text for forbidden values
        
        Args:
            text: The text to scan (e.g., Charter log output)
            log_type: "charter" (strict) or "ledger" (permissive)
            
        Returns:
            {
                "safe": bool,
                "violations": List[Dict],
                "v.i.b.e_score": float,
                "action": "HALT" | "WARN" | "PASS"
            }
        """
        if log_type == "ledger":
            # Ledger can contain everything
            return {
                "safe": True,
                "violations": [],
                "vibe_score": 1.0,
                "action": "PASS"
            }
        
        violations = []
        
        for category, compiled_patterns in self.compiled_patterns.items():
            for pattern in compiled_patterns:
                matches = pattern.findall(text)
                if matches:
                    violations.append({
                        "category": category,
                        "pattern": pattern.pattern,
                        "matches": matches,
                        "severity": "CRITICAL" if category in ["internal_costs", "api_keys"] else "HIGH"
                    })
        
        # Calculate V.I.B.E. impact
        # Verifiable: Can we verify this violation? (always 1.0 for pattern match)
        # Bounded: How well are constraints enforced? (0.0 if violated)
        verifiable = 1.0
        bounded = 0.0 if violations else 1.0
        vibe_score = (verifiable + bounded) / 2
        
        result = {
            "safe": len(violations) == 0,
            "violations": violations,
            "vibe_score": vibe_score,
            "action": "PASS" if not violations else "HALT"
        }
        
        return result
    
    def generate_halt_report(self, scan_result: Dict, text_preview: str = "") -> str:
        """Generate human-readable HALT report"""
        if scan_result["safe"]:
            return "✅ No violations detected. Charter output is safe."
        
        report = "🛑 HALT INVOKED - Forbidden Value Scanner 🛑\n\n"
        report += f"Violation Count: {len(scan_result['violations'])}\n"
        report += f"V.I.B.E. Score: {scan_result['vibe_score']:.2f} (Threshold: 0.85)\n\n"
        
        for i, violation in enumerate(scan_result["violations"], 1):
            report += f"Violation #{i}:\n"
            report += f"  Category: {violation['category']}\n"
            report += f"  Severity: {violation['severity']}\n"
            report += f"  Pattern: {violation['pattern']}\n"
            report += f"  Matches: {violation['matches']}\n\n"
        
        if text_preview:
            report += f"Text Preview (first 200 chars):\n{text_preview[:200]}...\n\n"
        
        report += "Action Required:\n"
        report += "  1. Remove forbidden values from Charter output\n"
        report += "  2. Ensure sensitive data exists only in Ledger\n"
        report += "  3. Request human approval to proceed\n"
        
        return report


# Tool interface for Agent Zero
def scan_charter_output(text: str) -> str:
    """
    Agent Zero tool to scan Charter outputs for forbidden values
    
    Usage in prompts:
    "Before showing this to the customer, scan it: scan_charter_output(output_text)"
    """
    scanner = ForbiddenValueScanner()
    result = scanner.scan_text(text, log_type="charter")
    
    if result["action"] == "HALT":
        return scanner.generate_halt_report(result, text)
    else:
        return f"✅ Charter output verified. V.I.B.E. Score: {result['vibe_score']:.2f}"


# Example usage
if __name__ == "__main__":
    scanner = ForbiddenValueScanner()
    
    # Test case 1: Safe Charter output
    safe_text = "Your service costs $50/month with standard industry rates."
    result1 = scanner.scan_text(safe_text)
    print("Test 1 (Safe):", result1)
    
    # Test case 2: Forbidden value in Charter
    unsafe_text = "Service includes Gemini API at $0.039 per 1K tokens with 300% markup."
    result2 = scanner.scan_text(unsafe_text)
    print("\nTest 2 (Violation):", scanner.generate_halt_report(result2, unsafe_text))
