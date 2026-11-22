import { Prisma } from "@prisma/client";

export interface PrismaKnownRequestErrorLike {
  code: string;
  message: string;
  meta?: Record<string, unknown>;
}

export function isPrismaError(
  error: unknown,
): error is Prisma.PrismaClientKnownRequestError & PrismaKnownRequestErrorLike {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return true;
  }

  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as { code: unknown }).code === "string" &&
    "message" in error &&
    typeof (error as { message: unknown }).message === "string"
  );
}
