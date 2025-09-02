import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './components/login/login';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  // Futuramente, adicionaremos a rota 'register' aqui
  { path: '', redirectTo: 'login', pathMatch: 'full' } // Rota padrão
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AuthRoutingModule { }