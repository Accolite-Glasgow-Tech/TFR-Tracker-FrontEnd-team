import { CreateGuard } from 'src/app/services/guards/create-guard/create.guard';
import { LoginGuardService } from 'src/app/services/guards/login-guard/login-guard.service';
import { LogoutGuardService } from 'src/app/services/guards/logout-guard/logout-guard.service';
import { ErrorGeneratorComponent } from './components/error-generator/error-generator.component';
import { ErrorComponent } from './components/error/error.component';
import { HomeComponent } from './components/home/home.component';
import { LogOutComponent } from './components/log-out/log-out.component';
import { ProjectSchedulesComponent } from './components/project-schedules/project-schedules.component';
import { ReportsComponent } from './components/reports/reports.component';
import { StepperComponent } from './components/stepper/stepper.component';
import { TfrComponent } from './components/tfr/tfr.component';
import { TfrsComponent } from './components/tfrs/tfrs.component';
import { UserSchedulesComponent } from './components/user-schedules/user-schedules.component';
import { UserComponent } from './components/user/user.component';
import { WriteGuard } from './services/guards/write-guard/write.guard';
import { ProjectResolverService } from './services/project-resolver/project-resolver.service';
import { TFRRoute } from './shared/interfaces';

export const appRoutes: TFRRoute[] = [
  {
    navigationLabel: 'Home',
    path: 'home',
    component: HomeComponent,
    canActivate: [LoginGuardService],
  },
  {
    path: 'login',
    navigationLabel: 'Login',
    component: UserComponent,
    canActivate: [LogoutGuardService],
  },
  {
    path: 'register',
    navigationLabel: 'Register',
    component: UserComponent,
    canActivate: [LogoutGuardService],
  },
  {
    navigationLabel: 'TFRs',
    path: 'tfrs',
    component: TfrsComponent,
    canActivate: [LoginGuardService],
  },
  {
    path: 'tfr/create',
    component: StepperComponent,
    navigationLabel: 'Create TFR',
    canActivate: [CreateGuard],
  },
  {
    path: 'logout',
    component: LogOutComponent,
    canActivate: [LoginGuardService],
  },
  {
    path: 'tfr/:id/edit',
    component: StepperComponent,
    canActivate: [WriteGuard],

    resolve: {
      project: ProjectResolverService,
    },
  },
  {
    canActivate: [LoginGuardService],
    path: 'tfr/:id',
    component: TfrComponent,
    resolve: {
      project: ProjectResolverService,
    },
  },
  {
    canActivate: [LoginGuardService],
    path: 'tfr',
    component: TfrComponent,
  },
  {
    canActivate: [LoginGuardService],
    path: 'tfr/:id/reports',
    component: ReportsComponent,
  },
  {
    canActivate: [LoginGuardService],
    path: 'mySchedules',
    component: UserSchedulesComponent,
  },
  {
    canActivate: [LoginGuardService],
    path: 'tfr/:id/schedules',
    component: ProjectSchedulesComponent,
  },
  {
    path: 'errors',
    component: ErrorGeneratorComponent,
  },
  {
    canActivate: [LoginGuardService],
    path: 'error',
    component: ErrorComponent,
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];
