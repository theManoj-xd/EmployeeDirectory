import { Component, inject, OnInit, signal, effect } from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { EmployeeService } from '../services/employee-service';
import { Employee } from '../models/employee.model';

@Component({
  selector: 'app-employee-list',
  imports: [CommonModule, DecimalPipe, DatePipe],
  templateUrl: './employee-list.html',
  styleUrl: './employee-list.css',
})
export class EmployeeList implements OnInit
{
  private employeeService: EmployeeService = inject(EmployeeService);
  private searchSubject: Subject<string> = new Subject<string>();

  allEmployees = signal<Employee[]>([]);
  employees = signal<Employee[]>([]); 
  isLoading = signal<boolean>(true);
  searchTerm = signal<string>('');

  ngOnInit(): void
  {
    //Setup search subscription
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged())
      .subscribe((term) => {
        this.searchTerm.set(term);
        this.filterEmployees();
      }); 
    this.isLoading.set(true);
    this.employeeService.getEmployees()
    .subscribe({
      next: (data: Employee[]) => {
        this.employees.set(data);
        this.allEmployees.set(data);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error fetching employees:', error);
        this.isLoading.set(false);
      }
    })
  }
  onSearch(term: string): void
  {
    this.searchSubject.next(term);
  }

  filterEmployees(): void
  {
    if(!this.searchTerm().trim())
    {
      this.employees.set(this.allEmployees());
      return;
    }
    const term = this.searchTerm().toLowerCase().trim();
    this.employees.set(this.allEmployees().filter((employee: Employee) =>
    {
      return (employee.firstName.toLowerCase().includes(term) ||
              employee.lastName.toLowerCase().includes(term) ||
              employee.email.toLowerCase().includes(term) ||
              employee.department.toLowerCase().includes(term));
    }));
  }
}
