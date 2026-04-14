import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Employee } from '../models/employee.model';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { signal } from '@angular/core';


@Injectable({
  providedIn: 'root',
})
export class EmployeeService {
  private http: HttpClient = inject(HttpClient);
  private apiUrl: string = `${environment.apiUrl}/employees`;

  private allEmployees = signal<Employee[]>([]);
  private searchTerm = signal<string>('');
  private sortColumn = signal<string>('');
  private sortDirection = signal<'asc' | 'desc'>('asc');

  //filter properties
  private filterDepartment: string = '';
  private filterStatus: string = '';
  private filterLocation: string = '';

  //Pagination Properties
  private currentPage: number = 1;
  private pageSize: number = 10;
  private filteredCount: number = 0;

  getEmployees(): Observable<Employee[]> {
    return this.http.get<Employee[]>(this.apiUrl);
  }

  setEmployees(employees: Employee[]): void {
    this.allEmployees.set(employees);
  }

  getSortColumn(): string {
    return this.sortColumn();
  }

  getSortDirection(): 'asc' | 'desc' {
    return this.sortDirection();
  }

  private getFilteredAndSortedEmployeesWithoutPagination(): Employee[] {
    let result = [...this.allEmployees()];

    //Apply search filter
    const term = this.searchTerm().toLowerCase();

    result = result.filter((employee: Employee) => {
      return (employee.firstName.toLowerCase().includes(term) ||
        employee.lastName.toLowerCase().includes(term) ||
        employee.email.toLowerCase().includes(term) ||
        employee.department.toLowerCase().includes(term) ||
        employee.location.toLowerCase().includes(term));
    });

    //Apply Department filter
    if (this.filterDepartment) {
      result = result.filter(emp => emp.department === this.filterDepartment);
    }
    //Apply Status filter
    if (this.filterStatus) {
      result = result.filter(emp => emp.status === this.filterStatus);
    }
    //Apply Location filter
    if (this.filterLocation) {
      result = result.filter(emp => emp.location === this.filterLocation);
    }
    //Apply sort
    result = this.applySort(result);

    return result;
  }

  getFilteredAndSortedEmployees(): Employee[] {
    const result = this.getFilteredAndSortedEmployeesWithoutPagination();

    //Store filtered count before pagination
    this.filteredCount = result.length;

    //Apply Pagination
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    return result.slice(startIndex, endIndex);
  }

  setSearchTerm(term: string): void {
    this.searchTerm.set(term);
    this.currentPage = 1; //Reset to first page on new search
  }

  setSort(column: string): void {
    if (this.sortColumn() === column) {
      this.sortDirection.set(this.sortDirection() == 'asc' ? 'desc' : 'asc');
    }
    else {
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }
  }

  private applySort(employees: Employee[]): Employee[] {
    if (!this.sortColumn()) {
      return employees;
    }
    else {
      return employees.sort((a: Employee, b: Employee) => {
        const valueA = a[this.sortColumn() as keyof Employee];
        const valueB = b[this.sortColumn() as keyof Employee];

        let comparison = 0;
        if (valueA == null) return 1;
        if (valueB == null) return -1;


        if (typeof valueA === 'string' && typeof valueB === 'string') {
          comparison = valueA.toLowerCase().localeCompare(valueB.toLowerCase());
        }
        else if (typeof valueA === 'number' && typeof valueB === 'number') {
          comparison = valueA - valueB;
        }
        return this.sortDirection() === 'desc' ? comparison * -1 : comparison;
      });
    }
  }

  //Get uniqies values from dropdown;
  getDepartments(): string[] {
    const departments: string[] = this.allEmployees().map(emp => emp.department);
    return [...new Set(departments)].sort();
  }

  getStatuses(): string[] {
    const statuses: string[] = this.allEmployees().map(emp => emp.status);
    return [...new Set(statuses)].sort();
  }

  getLocations(): string[] {
    const locations: string[] = this.allEmployees().map(emp => emp.location);
    return [...new Set(locations)].sort();
  }

  //Filter setters

  setDepartmentFilter(department: string): void {
    this.filterDepartment = department;
    this.currentPage = 1; //Reset to first page on new filter
  }

  setStatusFilter(status: string): void {
    this.filterStatus = status;
    this.currentPage = 1; //Reset to first page on new filter
  }

  setLocationFilter(location: string): void {
    this.filterLocation = location;
    this.currentPage = 1; //Reset to first page on new filter
  }

  getCurrentPage(): number {
    return this.currentPage;
  }

  getPageSize(): number {
    return this.pageSize;
  }

  getTotalPages(): number {
    return Math.ceil(this.filteredCount / this.pageSize);
  }

  getFilteredCount(): number {
    return this.filteredCount;
  }

  //Pagination Setters
  setPage(page: number): void {
    if (page < 1)
      return;
    if (page > this.getTotalPages()) {
      return;
    }
    this.currentPage = page;
  }

  nextPage(): void
  {
    if(this.currentPage < this.getTotalPages())
    {
      this.currentPage++;
    }
  }

  previousPage(): void
  {
    if(this.currentPage > 1)
    {
      this.currentPage--;
    }
  }

  deleteEmployee(id: number): void {
    this.allEmployees.set(this.allEmployees().filter(emp => emp.id !== id));

    // Recalculate filtered count without pagination
    const filteredEmployees = this.getFilteredAndSortedEmployeesWithoutPagination();
    this.filteredCount = filteredEmployees.length;
    
    // Adjust current page if it exceeds total pages
    const newTotalPages = Math.ceil(this.filteredCount / this.pageSize);
    if (this.currentPage > newTotalPages && newTotalPages > 0) {
      this.currentPage = newTotalPages;
    }
  }

  //Update Employee
  updateEmployee(id: number, updateData: Partial<Employee>): void {
    const index = this.allEmployees().findIndex(emp => emp.id === id);
    if (index === -1)
      return;
    
    const updatedEmployees = [...this.allEmployees()];
    updatedEmployees[index] = { ...updatedEmployees[index], ...updateData };
    this.allEmployees.set(updatedEmployees);
  }

  //Add Employee
  addEmployee(data: Partial<Employee>): void 
  {
    const newId = this.allEmployees().reduce((max, emp) => emp.id >max? emp.id : max, 0)+1;
    const newEmployee: Employee = {
      id: newId,
      firstName: data.firstName || '',
      lastName: data.lastName || '',
      email: data.email || '',
      phone: data.phone || '',
      department: data.department || 'Engineering',
      designation: data.designation || '',
      location: data.location || '',
      salary: data.salary || 0,
      joinDate: new Date().toISOString().split('T')[0],
      status: data.status || 'Active',
      managerId: null,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + newId
    };
    this.allEmployees.set([...this.allEmployees(), newEmployee]);
  }
}
