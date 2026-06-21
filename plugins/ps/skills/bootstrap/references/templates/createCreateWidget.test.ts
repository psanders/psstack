/**
 * Copyright (C) {{YEAR}} by {{ORG}}. {{LICENSE}}.
 *
 * Reference template for a unit test. Because the function takes its
 * dependencies by injection, the test simply passes a sinon-stubbed client —
 * no real database, no module mocking. One test file per function.
 *
 * Rules this file demonstrates:
 *   - mocha + chai + sinon.
 *   - `sinon.restore()` in `afterEach`.
 *   - Arrange / Act / Assert structure.
 *   - Cover both the happy path AND a validation failure (assert ValidationError).
 */
import { expect } from "chai";
import sinon from "sinon";
import { createCreateWidget } from "../../src/api/widgets/createCreateWidget.js";
import { ValidationError } from "@{{SCOPE}}/common";

describe("createCreateWidget", () => {
  const validInput = { name: "Sprocket", quantity: 3 };

  afterEach(() => {
    sinon.restore();
  });

  describe("with valid input", () => {
    it("should create a widget", async () => {
      // Arrange
      const expected = { id: "widget-123", ...validInput, isActive: true };
      const mockClient = {
        widget: { create: sinon.stub().resolves(expected) }
      };

      // Act
      const createWidget = createCreateWidget(mockClient as never);
      const result = await createWidget(validInput);

      // Assert
      expect(result).to.deep.equal(expected);
      expect(mockClient.widget.create.calledOnce).to.equal(true);
    });
  });

  describe("with invalid input", () => {
    it("should throw ValidationError when name is missing", async () => {
      // Arrange
      const mockClient = { widget: { create: sinon.stub() } };
      const createWidget = createCreateWidget(mockClient as never);

      // Act + Assert
      try {
        await createWidget({ quantity: 1 });
        expect.fail("expected ValidationError");
      } catch (err) {
        expect(err).to.be.instanceOf(ValidationError);
        expect(mockClient.widget.create.called).to.equal(false);
      }
    });
  });
});
