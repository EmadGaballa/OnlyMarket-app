package com.platform.ecommerce.common.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Bean-validation constraint enforcing the platform password policy (see
 * {@link PasswordPolicy}). Applied to password fields on request DTOs so the
 * global exception handler can surface a structured 400 with the exact failing
 * rules.
 */
@Documented
@Constraint(validatedBy = PasswordValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER, ElementType.RECORD_COMPONENT})
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidPassword {

  String message() default "Password does not meet the required policy";

  Class<?>[] groups() default {};

  Class<? extends Payload>[] payload() default {};
}