package com.platform.ecommerce.common.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

/** Backing implementation of {@link ValidPassword}, delegating to {@link PasswordPolicy}. */
public class PasswordValidator implements ConstraintValidator<ValidPassword, String> {

  @Override
  public boolean isValid(String value, ConstraintValidatorContext context) {
    String failure = PasswordPolicy.validate(value);
    if (failure == null) {
      return true;
    }
    context.disableDefaultConstraintViolation();
    context.buildConstraintViolationWithTemplate(failure).addConstraintViolation();
    return false;
  }
}