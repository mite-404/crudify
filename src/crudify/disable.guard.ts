import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";

@Injectable()
export class DisableRouteGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    // const request = context.switchToHttp().getRequest();
    // const handlerName = context.getHandler().name;
    return false;
  }
}
