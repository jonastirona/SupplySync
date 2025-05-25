import { Directive, Input, TemplateRef, ViewContainerRef, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';

@Directive({
  selector: '[hasPermission]',
  standalone: true
})
export class HasPermissionDirective implements OnInit {
  private permission: 'manage_products' | 'adjust_quantities' | 'view_logs' | 'manage_users' | undefined;
  private isHidden = true;

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private authService: AuthService
  ) {}

  @Input()
  set hasPermission(permission: 'manage_products' | 'adjust_quantities' | 'view_logs' | 'manage_users') {
    this.permission = permission;
    this.updateView();
  }

  ngOnInit() {
    this.updateView();
  }

  private updateView() {
    if (!this.permission) return;

    if (this.authService.hasPermission(this.permission)) {
      if (this.isHidden) {
        this.viewContainer.createEmbeddedView(this.templateRef);
        this.isHidden = false;
      }
    } else {
      this.viewContainer.clear();
      this.isHidden = true;
    }
  }
} 