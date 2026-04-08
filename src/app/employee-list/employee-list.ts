import { Component, inject, OnInit } from '@angular/core';
import { EmployeeService } from '../services/employee-service';
import { Employee } from '../models/employee.model';

@Component({
  selector: 'app-employee-list',
  imports: [],
  templateUrl: './employee-list.html',
  styleUrl: './employee-list.css',
})
export class EmployeeList implements OnInit
{
  private employeeService: EmployeeService = inject(EmployeeService);
  employees: Employee[] = [];

  ngOnInit(): void 
  {
    this.employeeService.getEmployees()
    .subscribe({
      next: (data: Employee[]) => {
        this.employees = data;
      },
      error: (error) => {
        console.error('Error fetching employees:', error);
      }
    })    
  }
}
