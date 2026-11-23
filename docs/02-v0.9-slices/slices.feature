Feature: SMS Shield Vertical Slices and Signature Challenge

  Scenario: VS1 incoming Chichewa scam SMS triggers warning
    Given protection is active and SMS arrives with Chichewa scam text
    When the VS1 detection chain evaluates the message
    Then a fraud warning is produced

  Scenario: VS1 genuine bundle SMS does not trigger false warning
    Given protection is active and a genuine bundle SMS arrives
    When the VS1 detection chain evaluates the message
    Then no fraud warning is triggered

  Scenario: VS1 English mobile money PIN phishing SMS triggers warning
    Given protection is active and an English PIN phishing SMS arrives
    When the VS1 detection chain evaluates the message
    Then a fraud warning is produced

  Scenario: VS1 rules stage short-circuits before ML fallback when rule matches
    Given a message matches a high-risk rule
    When VS1 runs the chain of responsibility
    Then the rule strategy returns the warning decision

  Scenario: VS1 falls back to ML classifier when no rule matches
    Given a message does not match static rules
    When VS1 runs the chain of responsibility
    Then the ML strategy evaluates the message

  Scenario: VS2 user submits explicit report into review queue
    Given a user selects a message and gives explicit consent to report
    When submitUserReport is called
    Then the report enters the pending review queue

  Scenario: VS2 unconsented report is rejected
    Given explicit user consent is false
    When submitUserReport is called
    Then the report is not queued

  Scenario: VS2 blank report body is rejected
    Given a report has an empty message body
    When submitUserReport is called
    Then the report is not queued

  Scenario: VS3 valid signed update is applied via proxy
    Given an update payload with a valid signature
    When SignedUpdateProxy applyUpdate is called
    Then the update is applied once

  Scenario: VS3 tampered update is rejected by proxy
    Given an update payload whose signature does not match
    When SignedUpdateProxy applyUpdate is called
    Then the update is rejected and not applied

  Scenario: Performance and size stay within device constraints
    Given the bundled offline model and 2 GB RAM target
    When a message is classified
    Then model size is within 10 MB and inference completes within 200 ms
